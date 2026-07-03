import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getOrCreateAffiliate, getWithdrawalsForAffiliate } from "../../../../lib/affiliateStore";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const affiliate = await getOrCreateAffiliate({ user_id: user.id, name: user.name || session.user.name || user.email.split("@")[0], email: user.email });
    const withdrawals = await getWithdrawalsForAffiliate(affiliate.id);
    return Response.json({ withdrawals });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
