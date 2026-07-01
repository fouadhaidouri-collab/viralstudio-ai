import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getOrCreateAffiliate, getClicksForAffiliate } from "../../../../lib/affiliateStore";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const affiliate = await getOrCreateAffiliate({ user_id: user.id, name: user.name || session.user.name || user.email.split("@")[0], email: user.email });
    if (!affiliate) return Response.json({ error: "Affiliate not found" }, { status: 404 });

    const clicks = await getClicksForAffiliate(affiliate.id, 1000);
    const signups_count = affiliate.signups || 0;
    const conversion_rate = affiliate.clicks > 0
      ? Math.round(((signups_count) / affiliate.clicks) * 10000) / 100
      : 0;
    return Response.json({
      affiliate,
      clicks_total: affiliate.clicks || 0,
      signups_total: signups_count,
      paid_customers: affiliate.total_earnings > 0 ? affiliate.signups : 0,
      conversion_rate,
      total_earnings: affiliate.total_earnings || 0,
      pending: affiliate.available_balance || 0,
      paid: affiliate.paid_balance || 0,
      commission_rate: affiliate.commission_percent || 30,
      clicks_latest: clicks,
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
