import { run, query } from "../../../../lib/db";

export async function GET() {
  try {
    await run("ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;");
  } catch (e) {}
  try {
    await run("CREATE TABLE IF NOT EXISTS clicks (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL, ip TEXT DEFAULT '', user_agent TEXT DEFAULT '', referrer TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));");
  } catch (e) {}
  try {
    await run("CREATE TABLE IF NOT EXISTS withdrawals (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL, amount REAL NOT NULL, method TEXT NOT NULL, account_details TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')), processed_at TEXT);");
  } catch (e) {}
  try {
    await run("CREATE TABLE IF NOT EXISTS affiliate_referrals (id TEXT PRIMARY KEY, affiliate_id TEXT NOT NULL, referred_user_id TEXT, subscription_id TEXT, commission REAL DEFAULT 0, status TEXT DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')));");
  } catch (e) {}
  return Response.json({ ok: true });
}
