import { auth } from "../../../lib/auth";
import { get, run } from "../../../../lib/db";
import {
  PLANS,
  getPlanPrice,
  getPlanCredits,
  createTransaction,
  updateTransaction,
} from "../../../../lib/paymentTransactions";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { planId, billingCycle, refCode, couponCode } = await req.json();

    if (!planId || !billingCycle) {
      return Response.json({ error: "Missing planId or billingCycle" }, { status: 400 });
    }

    if (!PLANS[planId]) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    let discountPercent = 0;
    if (couponCode) {
      const coupon = await get("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [couponCode]);
      if (coupon) {
        const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const maxed = coupon.max_uses > 0 && coupon.current_uses >= coupon.max_uses;
        if (!expired && !maxed) {
          discountPercent = coupon.discount_percent;
          await run("UPDATE coupons SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = ?", [coupon.id]);
        }
      }
    }

    const annual = billingCycle === "annual";
    let amount = getPlanPrice(planId, annual);
    const credits = getPlanCredits(planId, annual);
    if (discountPercent > 0) {
      amount = Math.round(amount * (100 - discountPercent)) / 100;
    }
    const userId = session.user.email;

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) {
      return Response.json({ error: "PayPal not configured" }, { status: 500 });
    }

    const useSandbox = process.env.PAYPAL_MODE !== "live";
    const paypalBase = useSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const authStr = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authStr}`,
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("PayPal auth error:", tokenData);
      return Response.json({ error: `PayPal auth failed: ${tokenData.error_description || tokenData.error || "unknown"}` }, { status: 500 });
    }

    const tx = createTransaction({
      userId,
      provider: "paypal",
      planId,
      billingCycle,
      amount,
      credits,
      status: "pending",
    });

    const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: tx.id,
            description: `${PLANS[planId].name} Plan - ${annual ? "Annual" : "Monthly"}`,
            amount: { currency_code: "USD", value: amount.toFixed(2) },
            custom_id: JSON.stringify({ transactionId: tx.id, userId, planId, billingCycle, credits, refCode: refCode || "", couponCode: couponCode || "" }),
          },
        ],
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.error("PayPal order error:", orderData);
      updateTransaction(tx.id, { status: "failed", raw_payload: orderData });
      return Response.json({ error: orderData.message || "PayPal order failed" }, { status: orderRes.status });
    }

    updateTransaction(tx.id, { provider_payment_id: orderData.id });

    return Response.json({
      orderId: orderData.id,
      transactionId: tx.id,
    });
  } catch (err) {
    console.error("PayPal create order error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
