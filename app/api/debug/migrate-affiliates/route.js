import { run } from "../../../../lib/db";

export async function GET() {
  const results = {};
  const creates = [
    "CREATE TABLE IF NOT EXISTS affiliate_accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, referral_code TEXT UNIQUE NOT NULL, commission_percent REAL DEFAULT 20, total_earnings REAL DEFAULT 0, available_balance REAL DEFAULT 0, paid_balance REAL DEFAULT 0, clicks INTEGER DEFAULT 0, signups INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')));",
    "CREATE TABLE IF NOT EXISTS clicks (id TEXT PRIMARY KEY, affiliate_id TEXT, ip TEXT DEFAULT '', user_agent TEXT DEFAULT '', referrer TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));",
    "CREATE TABLE IF NOT EXISTS affiliate_referrals (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL, referred_user_id TEXT NOT NULL UNIQUE, subscription_id TEXT, commission REAL DEFAULT 0, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));",
    "CREATE TABLE IF NOT EXISTS withdrawals (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL, amount REAL NOT NULL, method TEXT NOT NULL, account_details TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')), processed_at TEXT);",
  ];
  for (const sql of creates) {
    try {
      await run(sql);
      results[sql] = "ok";
    } catch (e) {
      results[sql] = e.message;
    }
  }
  const alters = [
    "ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;",
    "ALTER TABLE affiliate_accounts ADD COLUMN status TEXT DEFAULT 'active';",
    "ALTER TABLE clicks ADD COLUMN affiliate_id TEXT;",
    "ALTER TABLE clicks ADD COLUMN ip TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN user_agent TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN referrer TEXT DEFAULT '';",
    "ALTER TABLE clicks ADD COLUMN created_at TEXT DEFAULT (datetime('now'));",
    "ALTER TABLE withdrawals ADD COLUMN affiliate_id TEXT;",
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
  try {
    await run("CREATE TABLE IF NOT EXISTS coupons (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, discount_percent INTEGER NOT NULL, max_uses INTEGER DEFAULT 0, current_uses INTEGER DEFAULT 0, expires_at TEXT, is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));");
  } catch (e) {
    results["CREATE coupons table"] = e.message;
  }
  try {
    await run(
      "CREATE TABLE IF NOT EXISTS withdrawal_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount REAL NOT NULL, payment_method TEXT NOT NULL, payment_account TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
    );
    results["CREATE withdrawal_requests table"] = "ok";
  } catch (e) {
    results["CREATE withdrawal_requests table"] = e.message;
  }
  return Response.json({ results });
}
