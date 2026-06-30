import { findUserById } from "../../../../lib/userStore";
import { query, get } from "../../../../../lib/db";

export async function GET(_, { params }) {
  const { id } = await params;
  const user = await findUserById(id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  const creditsRec = await get("SELECT credits FROM user_credits WHERE user_id = ?", [id]);
  const transactions = await query("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC", [id]);
  const ledger = await query("SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC", [id]);
  const enriched = {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || "free",
    credits: creditsRec?.credits ?? user.credits ?? 0,
    storage_used: user.storage_used_bytes || 0,
    storage_total: user.storage_limit_bytes || 524288000,
    status: "active",
    role: "user",
    country: "-",
    signup_date: user.created_at,
    last_login: user.created_at,
    created_at: user.created_at,
    total_generations: 0,
    email_verified: true,
    payments: transactions.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      plan: t.plan_id,
      amount: t.amount,
      provider: t.provider,
      status: t.status,
      created_at: t.created_at,
    })),
    credit_transactions: ledger.map((l) => ({
      id: l.id,
      user_id: l.user_id,
      type: l.credits_added >= 0 ? "purchase" : "usage",
      amount: l.credits_added,
      reason: l.reason || "-",
      tool: "-",
      model: "-",
      created_at: l.created_at,
    })),
  };
  return Response.json({ user: enriched });
}
