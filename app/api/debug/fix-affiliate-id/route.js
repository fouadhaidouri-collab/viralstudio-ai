import { get, run, query } from "../../../../lib/db";

export async function GET() {
  const results = { fixed: [], errors: [] };

  try {
    await run("PRAGMA foreign_keys = OFF");
    const accounts = await query("SELECT id, user_id FROM affiliate_accounts WHERE id != user_id");
    for (const aff of accounts) {
      try {
        const oldId = aff.id;
        const newId = aff.user_id;
        const clicks = await get("SELECT COUNT(*) as c FROM clicks WHERE affiliate_id = ?", [oldId]);
        const refs = await get("SELECT COUNT(*) as c FROM affiliate_referrals WHERE affiliate_id = ?", [oldId]);
        const wds = await get("SELECT COUNT(*) as c FROM withdrawals WHERE affiliate_id = ?", [oldId]);
        if (clicks.c > 0) await run("UPDATE clicks SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        if (refs.c > 0) await run("UPDATE affiliate_referrals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        if (wds.c > 0) await run("UPDATE withdrawals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        await run("UPDATE affiliate_accounts SET id = ? WHERE id = ?", [newId, oldId]);
        results.fixed.push({ old_id: oldId, new_id: newId, clicks_updated: clicks.c, referrals_updated: refs.c, withdrawals_updated: wds.c });
      } catch (e) {
        results.errors.push({ id: aff.id, error: e.message });
      }
    }
    await run("PRAGMA foreign_keys = ON");
    results.total = accounts.length;
    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
