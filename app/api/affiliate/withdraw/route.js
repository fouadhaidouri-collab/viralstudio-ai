import { auth } from "../../../lib/auth";
import { getOrCreateAffiliate, createWithdrawal } from "../../../../lib/affiliateStore";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, name } = session.user;
  const { amount, method, account_details } = await req.json();
  if (!amount || !method) {
    return Response.json({ error: "Amount and method are required" }, { status: 400 });
  }
  const affiliate = await getOrCreateAffiliate({ user_id: email, name: name || email.split("@")[0], email });
  if (amount > (affiliate.total_pending || 0)) {
    return Response.json({ error: "Insufficient pending balance" }, { status: 400 });
  }
  const wd = await createWithdrawal({
    affiliate_user_id: email,
    affiliate_code: affiliate.code,
    amount,
    method,
    account_details: account_details || "",
  });
  if (!wd) {
    return Response.json({ error: "Withdrawal failed" }, { status: 500 });
  }
  return Response.json({ withdrawal: wd }, { status: 201 });
}
