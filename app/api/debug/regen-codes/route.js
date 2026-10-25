import { NextResponse } from "next/server";
import { query, run, get } from "@/lib/db";
import { auth } from "@/app/lib/auth";
import { generateAffiliateCode } from "@/lib/affiliateStore";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await get("SELECT role FROM users WHERE email = ?", [session.user.email]);
    if (admin?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const affiliates = await query("SELECT id, user_id, referral_code FROM affiliate_accounts");
    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ message: "No affiliates found" });
    }
    const results = [];
    for (const aff of affiliates) {
      const user = await get("SELECT name, email FROM users WHERE id = ?", [aff.user_id]);
      if (!user) {
        results.push({ id: aff.id, old_code: aff.referral_code, error: "User not found" });
        continue;
      }
      const newCode = await generateAffiliateCode({ name: user.name, email: user.email });
      await run("UPDATE affiliate_accounts SET referral_code = ? WHERE id = ?", [newCode, aff.id]);
      results.push({ id: aff.id, old_code: aff.referral_code, new_code: newCode });
    }
    return NextResponse.json({ regenerated: results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
