import { NextResponse } from "next/server";
import { run, query, get } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminEmail = body.adminEmail || "fouadhaidouri@gmail.com";

    const admin = await get("SELECT id FROM users WHERE email = ?", [adminEmail]);
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    await run("DELETE FROM affiliate_referrals WHERE referred_user_id IN (SELECT id FROM users WHERE email != ?)", [adminEmail]);
    await run("DELETE FROM clicks WHERE affiliate_id IN (SELECT id FROM affiliate_accounts WHERE user_id IN (SELECT id FROM users WHERE email != ?))", [adminEmail]);
    await run("DELETE FROM affiliate_accounts WHERE user_id IN (SELECT id FROM users WHERE email != ?)", [adminEmail]);
    await run("DELETE FROM payments WHERE user_id IN (SELECT id FROM users WHERE email != ?)", [adminEmail]);
    await run("DELETE FROM withdrawals WHERE affiliate_id IN (SELECT id FROM affiliate_accounts WHERE user_id IN (SELECT id FROM users WHERE email != ?))", [adminEmail]);
    await run("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email != ?)", [adminEmail]);
    await run("DELETE FROM users WHERE email != ?", [adminEmail]);

    return NextResponse.json({ success: true, message: `All users except ${adminEmail} have been removed` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
