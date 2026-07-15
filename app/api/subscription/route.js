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

  const cycle = sub.billing_cycle || "monthly";
  const msPerDay = 86400000;
  const msPerWeek = 7 * msPerDay;
  const msPerMonth = 30.5 * msPerDay;
  const totalDays = Math.max(0, Math.ceil((expireDate - startDate) / msPerDay));
  const daysLeft = Math.max(0, Math.ceil((expireDate - now) / msPerDay));

  let result;

  if (cycle === "weekly") {
    const totalWeeks = Math.round(totalDays / 7);
    const weekMs = now - startDate;
    const weeksUsed = Math.min(totalWeeks, Math.max(0, Math.floor(weekMs / msPerWeek)));
    result = {
      is_yearly: false,
      is_weekly: true,
      total_periods: totalWeeks,
      periods_used: weeksUsed,
      periods_remaining: totalWeeks - weeksUsed,
      period_label: "week",
      next_payment: new Date(startDate.getTime() + (weeksUsed + 1) * msPerWeek).toISOString(),
    };
  } else if (cycle === "yearly") {
    const totalMonths = 12;
    const monthsUsed = Math.min(totalMonths, Math.max(0, Math.floor((now - startDate) / msPerMonth)));
    result = {
      is_yearly: true,
      is_weekly: false,
      total_periods: totalMonths,
      periods_used: monthsUsed,
      periods_remaining: totalMonths - monthsUsed,
      period_label: "month",
      next_payment: new Date(startDate.getTime() + (monthsUsed + 1) * msPerMonth).toISOString(),
    };
  } else {
    const totalMonths = 1;
    const monthsUsed = Math.min(totalMonths, Math.max(0, (now - startDate) / msPerMonth));
    result = {
      is_yearly: false,
      is_weekly: false,
      total_periods: totalMonths,
      periods_used: Math.floor(monthsUsed),
      periods_remaining: totalMonths - Math.floor(monthsUsed),
      period_label: "month",
      next_payment: new Date(startDate.getTime() + 1 * msPerMonth).toISOString(),
    };
  }

  return Response.json({
    plan: sub.plan_name || sub.plan_id,
    plan_id: sub.plan_id,
    billing: cycle,
    status: sub.status,
    starts_at: sub.starts_at,
    expires_at: sub.expires_at,
    auto_renew: !!sub.auto_renew,
    price: sub.price,
    credits_per_cycle: sub.credits,
    days_left: daysLeft,
    total_days: totalDays,
    ...result,
  });
}
