import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    const affs = await query(
      `SELECT a.id, a.user_id, a.referral_code AS code, a.commission_percent AS commission_rate,
              a.total_earnings, a.available_balance, a.paid_balance,
              a.clicks AS total_clicks, a.signups AS total_signups,
              a.created_at, COALESCE(a.status, 'active') AS status,
              u.name, u.email,
              (SELECT COUNT(*) FROM payments p WHERE p.user_id = a.user_id AND p.status = 'completed') AS total_paid_customers
       FROM affiliate_accounts a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`
    );
    results.affiliates = affs;
  } catch (e) {
    results.error = e.message;
    results.stack = e.stack;
  }
  return NextResponse.json(results);
}
