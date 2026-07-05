import { get, run, query } from "../../../../lib/db";

export async function GET() {
  const results = { fixed: [], errors: [] };

  try {
    const accounts = await query("SELECT * FROM affiliate_accounts WHERE id != user_id");
    for (const aff of accounts) {
      try {
        const oldId = aff.id;
        const newId = aff.user_id;
        await run(
          "INSERT OR REPLACE INTO affiliate_accounts (id, user_id, referral_code, commission_percent, total_earnings, available_balance, paid_balance, clicks, signups, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newId, aff.user_id, aff.referral_code, aff.commission_percent, aff.total_earnings, aff.available_balance, aff.paid_balance, aff.clicks, aff.signups, aff.status, aff.created_at]
        );
        await run("UPDATE clicks SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        await run("UPDATE affiliate_referrals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        await run("UPDATE withdrawals SET affiliate_id = ? WHERE affiliate_id = ?", [newId, oldId]);
        await run("DELETE FROM affiliate_accounts WHERE id = ?", [oldId]);
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
