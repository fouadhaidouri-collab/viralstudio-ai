import { run, get } from "../../../../lib/db";

export async function GET() {
  try {
    const userId = "78015401";
    await run("UPDATE affiliate_accounts SET total_earnings = 1000, available_balance = 1000 WHERE user_id = ?", [userId]);
    const aff = await get("SELECT * FROM affiliate_accounts WHERE user_id = ?", [userId]);
    return Response.json({ message: "Funds added", affiliate: aff });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
