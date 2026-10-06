import { getFalKey } from "@/lib/fal-key";
import { getModule } from "@/lib/modules";
import { deductUserCredits } from "@/lib/pricing";
import { auth } from "../../../../lib/auth";

const FAL_BASE = "https://queue.fal.run";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

export async function GET(request, { params }) {
  const { module_id } = await params;
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const credits = Number(searchParams.get("credits")) || 0;

  if (!requestId) {
    return Response.json({ error: "Missing requestId" }, { status: 400 });
  }

  const mod = getModule(module_id);
  if (!mod) {
    return Response.json({ error: "Module not found" }, { status: 404 });
  }

  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json(
      { error: "Generation service is not configured yet.", setupRequired: true },
      { status: 503 }
    );
  }

  let statusRes;
  try {
    statusRes = await fetch(`${FAL_BASE}/${mod.endpoint_id}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
  } catch (err) {
    console.error(`fal status network error [${module_id}]:`, err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!statusRes.ok) {
    const text = (await statusRes.text()).slice(0, 400);
    console.error(`fal status failed [${module_id}] ${statusRes.status}: ${text}`);
    return Response.json({ error: PROVIDER_UNAVAILABLE, provider_status: statusRes.status }, { status: 503 });
  }

  const statusData = await statusRes.json();

  if (statusData.status === "COMPLETED") {
    const resultRes = await fetch(`${FAL_BASE}/${mod.endpoint_id}/requests/${requestId}`, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
    const result = await resultRes.json();

    const outputUrl = result.video?.url || result.video_url || result.image?.url || result.image_url || result.images?.[0]?.url || result.audio?.url || result.output?.url || null;

    // Charge the user ONLY after the job is actually completed.
    // If a provider failure happened, no credit was ever deducted.
    if (credits > 0) {
      try {
        const session = await auth();
        const userId = session?.user?.id || session?.user?.email;
        if (userId) {
          const deduction = await deductUserCredits(userId, credits, module_id, mod.endpoint_id, { request_id: requestId });
          if (!deduction.success) {
            console.error(`credit deduction skipped for ${userId}: ${deduction.error}`);
          }
        }
      } catch (err) {
        console.error("credit deduction error:", err.message);
      }
    }

    return Response.json({ status: "COMPLETED", outputUrl, ...result });
  }

  return Response.json({ status: statusData.status, ...statusData });
}