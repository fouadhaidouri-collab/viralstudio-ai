import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    const wds = await query(
      `SELECT w.*, a.referral_code AS affiliate_code
       FROM withdrawals w
       LEFT JOIN affiliate_accounts a ON w.affiliate_id = a.id
       ORDER BY w.created_at DESC`
    );
    results.withdrawals = wds;
  } catch (e) {
    results.error = e.message;
    results.stack = e.stack;
  }
  return NextResponse.json(results);
}
