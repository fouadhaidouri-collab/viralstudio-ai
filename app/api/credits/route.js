import { getUserCredits, addUserCredits, deductUserCredits, getCreditSettings } from "@/lib/pricing";

const DEFAULT_USER = "default";

export async function GET() {
  const user = await getUserCredits(DEFAULT_USER);
  const settings = await getCreditSettings();
  return Response.json({ balance: user.balance_credits || 0, currency: "credits", credit_pack: `$${settings.credit_pack_price_usd} = ${settings.credit_pack_credits} credits` });
}

export async function POST(request) {
  const { action, amount, module_id, endpoint_id } = await request.json();

  if (action === "purchase") {
    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await addUserCredits(DEFAULT_USER, amount, "purchase", { module_id, endpoint_id });
    return Response.json({ success: true, balance: result.balance });
  }

  if (action === "deduct") {
    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await deductUserCredits(DEFAULT_USER, amount, module_id, endpoint_id);
    if (!result.success) {
      return Response.json({ error: result.error, balance: result.balance }, { status: 402 });
    }
    return Response.json({ success: true, balance: result.balance, transaction: result.transaction });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
