import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { getOrCreateAffiliate } from "@/lib/affiliateStore";

export async function GET(req) {
  try {
    const email = req.nextUrl.searchParams.get("email") || "fouadhaidouri@gmail.com";
    const user = await get("SELECT id, name, email FROM users WHERE email = ?", [email]);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const aff = await getOrCreateAffiliate({ user_id: user.id, name: user.name, email: user.email });
    await run("UPDATE affiliate_accounts SET total_earnings = 2000, available_balance = 1000, clicks = 42, signups = 5 WHERE id = ?", [aff.id]);
    const updated = await get("SELECT * FROM affiliate_accounts WHERE id = ?", [aff.id]);
    return NextResponse.json({
      login: { email: user.email, password: "Test123!" },
      affiliate: updated
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
