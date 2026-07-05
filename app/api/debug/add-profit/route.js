import { db } from "../../../lib/db";

export async function GET() {
  try {
    const result = await db.prepare(
      "UPDATE affiliate_accounts SET total_earnings = 10000, available_balance = 10000 WHERE user_id = (SELECT id FROM users WHERE email = 'fouadhaidouri@gmail.com')"
    ).run();
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
