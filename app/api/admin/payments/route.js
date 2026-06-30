import { query } from "../../../../lib/db";

export async function GET() {
  const rows = await query(
    "SELECT p.*, u.name AS user_name, u.email AS user_email FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC"
  );
  const payments = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    user_name: r.user_name || r.user_id,
    user_email: r.user_email || "",
    plan: r.plan_id,
    amount: r.amount,
    currency: r.currency || "USD",
    provider: r.provider,
    status: r.status,
    invoice_link: null,
    billing_cycle: r.billing_cycle,
    created_at: r.created_at,
  }));
  return Response.json({ payments });
}
