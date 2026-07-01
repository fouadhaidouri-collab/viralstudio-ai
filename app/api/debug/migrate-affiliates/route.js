import { run, query } from "../../../../lib/db";

export async function GET() {
  try {
    await run("ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;");
  } catch (e) {}
  try {
    await run("ALTER TABLE clicks ADD COLUMN affiliate_id TEXT;");
  } catch (e) {}
  try {
    await run("ALTER TABLE clicks ADD COLUMN ip TEXT DEFAULT '';");
  } catch (e) {}
  try {
    await run("ALTER TABLE clicks ADD COLUMN user_agent TEXT DEFAULT '';");
  } catch (e) {}
  try {
    await run("ALTER TABLE clicks ADD COLUMN referrer TEXT DEFAULT '';");
  } catch (e) {}
  try {
    await run("ALTER TABLE clicks ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));");
  } catch (e) {}
  try {
    await run("ALTER TABLE withdrawals ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));");
  } catch (e) {}
  try {
    await run("ALTER TABLE withdrawals ADD COLUMN processed_at TEXT;");
  } catch (e) {}
  try {
    await run("ALTER TABLE affiliate_referrals ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));");
  } catch (e) {}
  const tables = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const cols = [];
  for (const t of tables) {
    const info = await query(`PRAGMA table_info('${t.name}')`);
    cols.push({ table: t.name, columns: info.map(c => c.name) });
  }
  return Response.json({ tables: tables.map(t => t.name), columns: cols });
}
