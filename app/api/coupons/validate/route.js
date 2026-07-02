import { get } from "../../../../lib/db";

export async function POST(request) {
  try {
    const { code, planId, billingCycle } = await request.json();
    if (!code) {
      return Response.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await get("SELECT * FROM coupons WHERE code = ?", [code.toUpperCase()]);
    if (!coupon) {
      return Response.json({ error: "Invalid coupon code" }, { status: 404 });
    }
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
  } catch (err) {
    console.error("validate coupon error:", err);
    return Response.json({ error: err.message || "Failed to validate coupon" }, { status: 500 });
  }
}
