import { run, get } from "../../../../lib/db";
import { getOrCreateAffiliate } from "../../../../lib/affiliateStore";

export async function GET() {
  try {
    const email = "fouadhaidouri@gmail.com";
    const user = await get("SELECT id, name, email FROM users WHERE email = ?", [email]);
    if (!user) return Response.json({ error: "User not found" });
    const aff = await getOrCreateAffiliate({ user_id: user.id, name: user.name, email: user.email });
    await run("UPDATE affiliate_accounts SET total_earnings = 1000, available_balance = 1000 WHERE id = ?", [aff.id]);
    const updated = await get("SELECT * FROM affiliate_accounts WHERE id = ?", [aff.id]);
    return Response.json({ message: "$1000 added to admin affiliate", affiliate: updated });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
