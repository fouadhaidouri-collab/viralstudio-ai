import { get, run, query } from "../../../../lib/db";

const CF_ACCOUNT = "8e54767bc972da1bc5ce41bd8763131a";
const CF_DB_ID = "07f34eb4-9007-4b91-893f-ddcb9d7f9694";
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${CF_DB_ID}`;

export async function GET() {
  const results = { fixed: [], errors: [] };
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  try {
    const accounts = await query("SELECT id, user_id FROM affiliate_accounts WHERE id != user_id");
    for (const aff of accounts) {
      try {
        const oldId = aff.id;
        const newId = aff.user_id;
        const sql = [
          `UPDATE clicks SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE affiliate_referrals SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE withdrawals SET affiliate_id = '${newId}' WHERE affiliate_id = '${oldId}'`,
          `UPDATE affiliate_accounts SET id = '${newId}' WHERE id = '${oldId}'`,
        ].join(";");

        const res = await fetch(`${API_BASE}/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ sql }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.errors?.[0]?.message || "query failed");
        }
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
