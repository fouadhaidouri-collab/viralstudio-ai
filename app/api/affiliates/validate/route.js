import { NextResponse } from "next/server";
import { getAffiliateByReferralCode } from "@/lib/affiliateStore";

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }
    const affiliate = await getAffiliateByReferralCode(code.trim().toUpperCase());
    if (!affiliate) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }
    return NextResponse.json({ valid: true, code: affiliate.referral_code });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
