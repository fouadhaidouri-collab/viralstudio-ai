import { run } from "../../../../lib/db";

export async function GET() {
  const results = {};
  const alters = [
    "ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;",
    "ALTER TABLE clicks ADD COLUMN affiliate_id TEXT;",
    "ALTER TABLE clicks ADD COLUMN ip TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN user_agent TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN referrer TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE withdrawals ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE withdrawals ADD COLUMN processed_at TEXT;",
    "ALTER TABLE affiliate_referrals ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
  ];
  for (const sql of alters) {
    try {
      await run(sql);
      results[sql] = "ok";
    } catch (e) {
      results[sql] = e.message;
    }
  }
  return Response.json({ results });
}
