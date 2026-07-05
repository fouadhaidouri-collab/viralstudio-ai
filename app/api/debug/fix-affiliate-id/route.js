import { get, run, query } from "../../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json({ error: "user_id param required" }, { status: 400 });
    }

    const aff = await get("SELECT * FROM affiliate_accounts WHERE user_id = ?", [userId]);
    if (!aff) {
      return Response.json({ error: "No affiliate account for this user" }, { status: 404 });
    }

    const oldId = aff.id;
    const newId = String(userId);

    if (oldId === newId) {
      return Response.json({ message: "Already using user_id as affiliate id", id: oldId });
    }

    const clicks = await get("SELECT COUNT(*) as c FROM clicks WHERE affiliate_id = ?", [oldId]);
    const refs = await get("SELECT COUNT(*) as c FROM affiliate_referrals WHERE affiliate_id = ?", [oldId]);
    const wds = await get("SELECT COUNT(*) as c FROM withdrawals WHERE affiliate_id = ?", [oldId]);

    if (clicks.c > 0) await run("UPDATE clicks SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
    if (refs.c > 0) await run("UPDATE affiliate_referrals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
    if (wds.c > 0) await run("UPDATE withdrawals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
    await run("UPDATE affiliate_accounts SET id = ? WHERE id = ?", [newId, oldId]);

    return Response.json({ success: true, old_id: oldId, new_id: newId, clicks_updated: clicks.c, referrals_updated: refs.c, withdrawals_updated: wds.c });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
