import { getFalKey } from "@/lib/fal-key";
import { getModule, validateModuleInput, estimateModuleCredits, calculateModuleCredits } from "@/lib/modules";
import { getUserCredits } from "@/lib/pricing";
import { buildFalPayload } from "@/lib/schema-parser";
import { auth } from "../../../../lib/auth";

const FAL_BASE = "https://queue.fal.run";
const STALE_HOURS = 12;

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

export async function POST(request, { params }) {
  const { module_id } = await params;
  const userInput = await request.json();

  // 1. Load module
  const mod = getModule(module_id);
  if (!mod) {
    return Response.json({ error: "Module not found" }, { status: 404 });
  }

  // 2. Real signed-in user. Credits are NEVER deducted here:
  //    they are charged only once the provider actually completes the job
  //    (see /status route). If the provider fails, the user keeps their credits.
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) {
    return Response.json({ error: "Please sign in to generate." }, { status: 401 });
  }

  // 3. Refresh pricing if stale
  if (mod.fal_pricing?.last_synced_at) {
    const ageHours = (Date.now() - new Date(mod.fal_pricing.last_synced_at).getTime()) / (1000 * 60 * 60);
    if (ageHours > STALE_HOURS) {
      await calculateModuleCredits(module_id);
    }
  }

  // 4. Validate input
  const validation = validateModuleInput(module_id, userInput);
  if (!validation.valid) {
    return Response.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
  }

  // 5. Estimate credits
  const estimate = estimateModuleCredits(module_id, userInput);
  if (estimate.pricing_unavailable || estimate.credits_required == null) {
    return Response.json({ error: "Pricing unavailable for this module. Cannot generate." }, { status: 402 });
  }

  // 6. Check credits (reservation only — no deduction)
  const user = await getUserCredits(userId);
  if ((user.balance_credits || 0) < estimate.credits_required) {
    return Response.json({
      error: "Not enough credits",
      credits_required: estimate.credits_required,
      balance: user.balance_credits || 0,
    }, { status: 402 });
  }

  // 7. Provider key
  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json(
      { error: "Generation service is not configured yet.", setupRequired: true },
      { status: 503 }
    );
  }

  // 8. Build payload and submit to fal.ai (no charge on failure)
  const payload = buildFalPayload(mod.fal_schema?.fields || [], userInput);

  let res;
  try {
    res = await fetch(`${FAL_BASE}/${mod.endpoint_id}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${keyResult.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`fal submit network error [${module_id}]:`, err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!res.ok) {
    const text = (await res.text()).slice(0, 400);
    console.error(`fal submit failed [${module_id}] ${res.status}: ${text}`);
    return Response.json({ error: PROVIDER_UNAVAILABLE, provider_status: res.status }, { status: 503 });
  }

  const data = await res.json();

  return Response.json({
    success: true,
    requestId: data.request_id,
    module_id,
    credits_required: estimate.credits_required,
    balance: user.balance_credits || 0,
  });
}