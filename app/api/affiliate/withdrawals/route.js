import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getWithdrawalRequestsForUser } from "../../../../lib/affiliateStore";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const withdrawals = await getWithdrawalRequestsForUser(user.id);
    return Response.json({ withdrawals });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
