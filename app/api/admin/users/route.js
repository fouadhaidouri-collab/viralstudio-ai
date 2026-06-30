import { getUsers, updateUserPlan } from "../../../lib/userStore";
import { query, run, get } from "../../../../lib/db";

export async function GET() {
  const users = await getUsers();
  const credits = await query("SELECT user_id, credits FROM user_credits");
  const creditMap = {};
  for (const c of credits) creditMap[c.user_id] = c.credits;
  const enriched = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan || "free",
    credits: creditMap[u.id] ?? u.credits ?? 0,
    storage_used: u.storage_used_bytes || 0,
    storage_total: u.storage_limit_bytes || 524288000,
    status: "active",
    role: "user",
    country: "-",
    signup_date: u.created_at,
    last_login: u.created_at,
    created_at: u.created_at,
    total_generations: 0,
    email_verified: true,
  }));
  return Response.json({ users: enriched, total: enriched.length });
}

export async function PATCH(req) {
  const body = await req.json();
  const { userId, action, value } = body;
  if (!userId || !action) {
    return Response.json({ error: "userId and action are required" }, { status: 400 });
  }
  switch (action) {
    case "add_credits": {
      const amount = parseInt(value) || 500;
      await run(
        "INSERT INTO user_credits (user_id, credits, total_purchased, total_used) VALUES (?, ?, 0, 0) ON CONFLICT(user_id) DO UPDATE SET credits = credits + ?",
        [userId, amount, amount]
      );
      const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await run(
        "INSERT INTO credit_ledger (id, user_id, credits_added, reason, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, userId, amount, `admin_add: +${amount}`]
      );
      const updated = await get("SELECT credits FROM user_credits WHERE user_id = ?", [userId]);
      return Response.json({ credits: updated?.credits ?? 0 });
    }
    case "remove_credits": {
      const amount = parseInt(value) || 200;
      const current = await get("SELECT credits FROM user_credits WHERE user_id = ?", [userId]);
      const remove = Math.min(amount, current?.credits ?? 0);
      await run("UPDATE user_credits SET credits = credits - ? WHERE user_id = ?", [remove, userId]);
      const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await run(
        "INSERT INTO credit_ledger (id, user_id, credits_added, reason, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, userId, -remove, `admin_remove: -${remove}`]
      );
      const updated = await get("SELECT credits FROM user_credits WHERE user_id = ?", [userId]);
      return Response.json({ credits: updated?.credits ?? 0 });
    }
    case "change_plan": {
      const plan = value || "free";
      await updateUserPlan(userId, plan);
      return Response.json({ plan });
    }
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
