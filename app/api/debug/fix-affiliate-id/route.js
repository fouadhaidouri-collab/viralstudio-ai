import { get, run, query } from "../../../../lib/db";

export async function GET() {
  const results = { fixed: [], errors: [] };

  try {
    const accounts = await query("SELECT * FROM affiliate_accounts WHERE id != user_id");
    for (const aff of accounts) {
      try {
        const oldId = aff.id;
        const newId = aff.user_id;
        const sql = [
          "PRAGMA foreign_keys = OFF",
          `UPDATE clicks SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE affiliate_referrals SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE withdrawals SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE affiliate_accounts SET id = '${newId}' WHERE id = '${oldId}'`,
        ].join(";") + ";";
        await run(sql);
        results.fixed.push({ old_id: oldId, new_id: newId });
      } catch (e) {
        results.errors.push({ id: aff.id, error: e.message });
      }
    }
    results.total = accounts.length;
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
