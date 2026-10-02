import { NextResponse } from "next/server";
import { run, query, get } from "@/lib/db";

export async function GET() {
  const results = {};
  const adminEmail = "fouadhaidouri@gmail.com";
  
  const sqls = [
    "DELETE FROM affiliate_referrals WHERE referred_user_id IN (SELECT id FROM users WHERE email != ?)",
    "DELETE FROM clicks WHERE affiliate_id IN (SELECT id FROM affiliate_accounts WHERE user_id IN (SELECT id FROM users WHERE email != ?))",
    "DELETE FROM affiliate_accounts WHERE user_id IN (SELECT id FROM users WHERE email != ?)",
    "DELETE FROM payments WHERE user_id IN (SELECT id FROM users WHERE email != ?)",
    "DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email != ?)",
    "DELETE FROM users WHERE email != ?",
  ];
  
  for (const sql of sqls) {
    try {
      const r = await run(sql, [adminEmail]);
      results[sql.substring(0, 60)] = { ok: true, changes: r.changes };
    } catch (e) {
      results[sql.substring(0, 60)] = { error: e.message };
    }
  }
  
  return NextResponse.json(results);
}
