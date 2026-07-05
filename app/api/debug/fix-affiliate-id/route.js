import { query, run } from "../../../../lib/db";

export async function GET() {
  const results = {};

  try {
    results.fk_list = await query("PRAGMA foreign_key_list(affiliate_accounts)");
    results.table_info = await query("PRAGMA table_info(affiliate_accounts)");
    results.fk_mode = await query("PRAGMA foreign_keys");
    const bad = await query("SELECT id, user_id FROM affiliate_accounts WHERE id != user_id");
    results.remaining = bad;
    for (const b of bad) {
      const user = await query("SELECT * FROM users WHERE id = ?", [b.user_id]);
      results[`user_${b.user_id}`] = user;
    }
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
