import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getOrCreateAffiliate, getReferralsForAffiliate } from "../../../../lib/affiliateStore";
import { query } from "../../../../lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const affiliate = await getOrCreateAffiliate({ user_id: user.id, name: user.name || session.user.name || user.email.split("@")[0], email: user.email });
    const referrals = await query(
      `SELECT r.id, r.referred_user_id, r.commission AS commission_earned, r.status, r.created_at,
              u.name AS referred_name, u.email AS referred_email,
              p.amount
       FROM affiliate_referrals r
       LEFT JOIN users u ON r.referred_user_id = u.id
       LEFT JOIN payments p ON p.user_id = r.referred_user_id AND p.status = 'completed'
       WHERE r.affiliate_id = ?
       ORDER BY r.created_at DESC`,
      [affiliate.id]
    );
    return Response.json({ referrals });
  } catch (err) {
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
