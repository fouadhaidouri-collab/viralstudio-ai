import { auth } from "../../lib/auth";
import { get } from "../../../lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await get(
    "SELECT us.*, p.name AS plan_name, p.billing_cycle, p.price, p.credits FROM user_subscriptions us LEFT JOIN plans p ON us.plan_id = p.id WHERE us.user_id = ? AND us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at >= datetime('now')) ORDER BY us.created_at DESC LIMIT 1",
    [session.user.id]
  );

  if (!sub) {
    return Response.json({ plan: "Free", plan_id: "free", billing: null });
  }

  const now = new Date();
  const startDate = sub.starts_at ? new Date(sub.starts_at) : now;
  const expireDate = sub.expires_at ? new Date(sub.expires_at) : new Date(now.getTime() + 365 * 86400000);
  const msPerMonth = 30.5 * 86400000;

  const isYearly = sub.billing_cycle === "yearly";
  const totalMonths = isYearly ? 12 : 1;
  const monthsUsed = Math.min(totalMonths, Math.max(0, Math.floor((now - startDate) / msPerMonth)));
  const monthsRemaining = totalMonths - monthsUsed;
  const daysLeft = Math.max(0, Math.ceil((expireDate - now) / 86400000));
  const nextPayment = new Date(startDate.getTime() + (monthsUsed + 1) * msPerMonth);

  return Response.json({
    plan: sub.plan_name || sub.plan_id,
    plan_id: sub.plan_id,
    billing: sub.billing_cycle || "monthly",
    status: sub.status,
    starts_at: sub.starts_at,
    expires_at: sub.expires_at,
    auto_renew: !!sub.auto_renew,
    price: sub.price,
    credits_per_cycle: sub.credits,
    is_yearly: isYearly,
    total_months: totalMonths,
    months_used: monthsUsed,
    months_remaining: monthsRemaining,
    days_left: daysLeft,
    next_payment: nextPayment.toISOString(),
  });
}
