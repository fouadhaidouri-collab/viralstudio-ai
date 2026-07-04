import { run, get } from "../../../../lib/db";

export async function POST(req) {
  try {
    const { email, balance } = await req.json();
    if (!email || balance === undefined) {
      return Response.json({ error: "email and balance required" }, { status: 400 });
    }
    const user = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const aff = await get("SELECT * FROM affiliate_accounts WHERE user_id = ?", [user.id]);
    if (!aff) return Response.json({ error: "Affiliate not found" }, { status: 404 });
    await run("UPDATE affiliate_accounts SET total_earnings = ?, available_balance = ? WHERE id = ?", [balance, balance, aff.id]);
    return Response.json({ ok: true, affiliate_id: aff.id, referral_code: aff.referral_code, balance });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
