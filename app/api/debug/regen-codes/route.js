import { NextResponse } from "next/server";
import { query, run, get } from "@/lib/db";

export async function GET() {
  try {
    const affiliates = await query("SELECT id, user_id, referral_code, email FROM affiliate_accounts");
    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({ message: "No affiliates found" });
    }
    const results = [];
    for (const aff of affiliates) {
      const user = await get("SELECT email FROM users WHERE id = ?", [aff.user_id]);
      if (!user) {
        results.push({ id: aff.id, old_code: aff.referral_code, error: "User not found" });
        continue;
      }
      const username = user.email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
      const num = String(Math.floor(100 + Math.random() * 900));
      const newCode = `${username}${num}`;
      await run("UPDATE affiliate_accounts SET referral_code = ? WHERE id = ?", [newCode, aff.id]);
      results.push({ id: aff.id, old_code: aff.referral_code, new_code: newCode });
    }
    return NextResponse.json({ regenerated: results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
