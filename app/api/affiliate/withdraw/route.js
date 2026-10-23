import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getAffiliateByUserId, createWithdrawalRequest } from "../../../../lib/affiliateStore";

export async function POST(req) {
  try {
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
    if (!account_details) {
      return Response.json({ error: "Please provide your payment details" }, { status: 400 });
    }
    const affiliate = await getAffiliateByUserId(user.id);
    if (!affiliate) {
      return Response.json({ error: "Please join the Affiliate Program first." }, { status: 403 });
    }
    const wd = await createWithdrawalRequest({ user_id: user.id, amount, payment_method: method, payment_account: account_details });
    if (wd?.error) {
      return Response.json({ error: wd.error }, { status: 400 });
    }
    return Response.json({ withdrawal: wd }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
