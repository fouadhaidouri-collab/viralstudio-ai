import { get } from "../../../../lib/db";
import { getAffiliateByReferralCode } from "../../../../lib/affiliateStore";

export async function POST(request) {
  try {
    const { code, planId, billingCycle } = await request.json();
    if (!code) {
      return Response.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const upperCode = code.toUpperCase();

    const coupon = await get("SELECT * FROM coupons WHERE code = ?", [upperCode]);
    if (coupon) {
      if (!coupon.is_active) {
        return Response.json({ error: "This coupon is no longer active" }, { status: 400 });
      }
      if (coupon.max_uses > 0 && coupon.current_uses >= coupon.max_uses) {
        return Response.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return Response.json({ error: "Coupon has expired" }, { status: 400 });
      }
      return Response.json({
        valid: true,
        code: coupon.code,
        discount_percent: coupon.discount_percent,
      });
    }

    const affiliate = await getAffiliateByReferralCode(upperCode);
    if (affiliate) {
      return Response.json({
        valid: true,
        code: affiliate.referral_code,
        discount_percent: 10,
        is_affiliate: true,
      });
    }

    return Response.json({ error: "Invalid coupon code" }, { status: 404 });
  } catch (err) {
    return Response.json({ error: err.message || "Failed to validate coupon" }, { status: 500 });
  }
}
