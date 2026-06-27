import { auth } from "../../../lib/auth";
import { getOrCreateAffiliate, getClicksForAffiliate } from "../../../../lib/affiliateStore";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, name } = session.user;
  const affiliate = getOrCreateAffiliate({ user_id: email, name: name || email.split("@")[0], email });
  const clicks = getClicksForAffiliate(affiliate.code, 1000);
  const signups_count = affiliate.total_signups || 0;
  const conversion_rate = affiliate.total_clicks > 0
    ? Math.round(((affiliate.total_paid_customers || 0) / affiliate.total_clicks) * 10000) / 100
    : 0;
  return Response.json({
    affiliate,
    clicks_total: affiliate.total_clicks || 0,
    signups_total: signups_count,
    paid_customers: affiliate.total_paid_customers || 0,
    conversion_rate,
    total_earnings: affiliate.total_earnings || 0,
    pending: affiliate.total_pending || 0,
    paid: affiliate.total_paid || 0,
    commission_rate: affiliate.commission_rate || 30,
    clicks_latest: clicks,
  });
}
