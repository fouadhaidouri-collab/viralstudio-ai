import { query } from "../../../../lib/db";

export async function GET() {
  const rows = await query(
    `SELECT p.*, u.name AS user_name, u.email AS user_email,
            COALESCE((SELECT SUM(credits_added) FROM credit_ledger WHERE transaction_id = p.id), 0) AS credits_added
     FROM payments p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY p.created_at DESC`
  );
  const logs = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    user_name: r.user_name || r.user_id,
    user_email: r.user_email || "",
    amount: r.amount,
    currency: r.currency || "USD",
    credits_added: r.credits_added || 0,
    plan_updated: r.plan_id,
    country: "-",
    status: r.status === "paid" ? "completed" : r.status,
    created_at: r.created_at,
  }));
  return Response.json({ logs });
}
