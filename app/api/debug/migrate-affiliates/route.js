import { run } from "../../../../lib/db";

export async function GET() {
  const results = {};
  const alters = [
    "ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;",
    "ALTER TABLE affiliate_accounts ADD COLUMN status TEXT DEFAULT 'active';",
    "ALTER TABLE clicks ADD COLUMN affiliate_id TEXT;",
    "ALTER TABLE clicks ADD COLUMN ip TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN user_agent TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN referrer TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE withdrawals ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE withdrawals ADD COLUMN processed_at TEXT;",
    "ALTER TABLE affiliate_referrals ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;",
  ];
  for (const sql of alters) {
    try {
      await run(sql);
      results[sql] = "ok";
    } catch (e) {
      results[sql] = e.message;
    }
  }
  try {
    await run("CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, message TEXT, is_read INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));");
  } catch (e) {
    results["CREATE notifications table"] = e.message;
  }
  try {
    await run("CREATE TABLE IF NOT EXISTS email_verifications (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));");
  } catch (e) {
    results["CREATE email_verifications table"] = e.message;
  }
  return Response.json({ results });
}
