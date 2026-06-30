import { auth } from "../../lib/auth";
import { getUserCredits, addUserCredits, deductUserCredits, getCreditSettings } from "@/lib/pricing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserCredits(session.user.id || session.user.email);
  const settings = await getCreditSettings();
  return Response.json({ balance: user.balance_credits || 0, currency: "credits", credit_pack: `$${settings.credit_pack_price_usd} = ${settings.credit_pack_credits} credits` });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id || session.user.email;
  const { action, amount, module_id, endpoint_id } = await request.json();

  if (action === "purchase") {
    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await addUserCredits(userId, amount, "purchase", { module_id, endpoint_id });
    return Response.json({ success: true, balance: result.balance });
  }

  if (action === "deduct") {
    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }
    const result = await deductUserCredits(userId, amount, module_id, endpoint_id);
    if (!result.success) {
      return Response.json({ error: result.error, balance: result.balance }, { status: 402 });
    }
    return Response.json({ success: true, balance: result.balance, transaction: result.transaction });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
