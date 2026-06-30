import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getOrCreateAffiliate, createWithdrawal } from "../../../../lib/affiliateStore";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await findUser(session.user.email);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const { amount, method, account_details } = await req.json();
  if (!amount || !method) {
    return Response.json({ error: "Amount and method are required" }, { status: 400 });
  }
  const affiliate = await getOrCreateAffiliate({ user_id: user.id, name: user.name || session.user.name || user.email.split("@")[0], email: user.email });
  if (amount > (affiliate.available_balance || 0)) {
    return Response.json({ error: "Insufficient pending balance" }, { status: 400 });
  }
  const wd = await createWithdrawal({ affiliate_id: affiliate.id, amount, method, account_details: account_details || "" });
  if (!wd) {
    return Response.json({ error: "Withdrawal failed" }, { status: 500 });
  }
  return Response.json({ withdrawal: wd }, { status: 201 });
}
