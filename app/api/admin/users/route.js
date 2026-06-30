import { getUsers } from "../../../lib/userStore";
import { query, run, get } from "../../../../lib/db";

export async function GET() {
  const users = await getUsers();
  const credits = await query("SELECT user_id, current_balance FROM credits");
  const creditMap = {};
  for (const c of credits) creditMap[c.user_id] = c.current_balance;
  const enriched = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    credits: creditMap[u.id] ?? 0,
    status: u.status || "active",
    signup_date: u.created_at,
    last_login: u.last_login || u.created_at,
    created_at: u.created_at,
    email_verified: !!u.email_verified,
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
      const existing = await get("SELECT * FROM credits WHERE user_id = ?", [userId]);
      if (existing) {
        await run("UPDATE credits SET current_balance = current_balance + ?, total_purchased = total_purchased + ?, updated_at = datetime('now') WHERE user_id = ?", [amount, amount, userId]);
      } else {
        const credId = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await run("INSERT INTO credits (id, user_id, current_balance, total_purchased, total_used, updated_at) VALUES (?, ?, ?, ?, 0, datetime('now'))", [credId, userId, amount, amount]);
      }
      const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await run(
        "INSERT INTO credit_ledger (id, user_id, credits_added, reason, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, userId, amount, `admin_add: +${amount}`]
      );
      const updated = await get("SELECT current_balance FROM credits WHERE user_id = ?", [userId]);
      return Response.json({ credits: updated?.current_balance ?? 0 });
    }
    case "remove_credits": {
      const amount = parseInt(value) || 200;
      const current = await get("SELECT current_balance FROM credits WHERE user_id = ?", [userId]);
      const remove = Math.min(amount, current?.current_balance ?? 0);
      await run("UPDATE credits SET current_balance = current_balance - ?, total_used = total_used + ?, updated_at = datetime('now') WHERE user_id = ?", [remove, remove, userId]);
      const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await run(
        "INSERT INTO credit_ledger (id, user_id, credits_added, reason, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, userId, -remove, `admin_remove: -${remove}`]
      );
      const updated = await get("SELECT current_balance FROM credits WHERE user_id = ?", [userId]);
      return Response.json({ credits: updated?.current_balance ?? 0 });
    }
    case "change_plan": {
      return Response.json({ plan: value || "free" });
    }
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
