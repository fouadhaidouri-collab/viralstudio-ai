import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { getOrCreateAffiliate } from "@/lib/affiliateStore";

export async function GET() {
  try {
    const admin = await get("SELECT id, name, email FROM users WHERE email = ?", ["fouadhaidouri@gmail.com"]);
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found. Login first with fouadhaidouri@gmail.com" }, { status: 404 });
    }
    const affiliate = await getOrCreateAffiliate({ user_id: admin.id, name: admin.name, email: admin.email });
    await run("UPDATE affiliate_accounts SET total_earnings = 2000, available_balance = 1000 WHERE id = ?", [affiliate.id]);
    const updated = await get("SELECT * FROM affiliate_accounts WHERE id = ?", [affiliate.id]);
    return NextResponse.json({ affiliate: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
