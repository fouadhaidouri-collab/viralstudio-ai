import { auth } from "../../../lib/auth";
import {
  PLANS,
  getPlanPrice,
  getPlanCredits,
  createTransaction,
  updateTransaction,
} from "@/lib/paymentTransactions";
import { get } from "@/lib/db";
import { tokenizePayment, paymentFormUrl } from "@/lib/youcanpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payments/youcanpay
// Creates our pending transaction, then asks YouCan Pay for a payment token
// and hands back the hosted payment form URL the browser should redirect to.
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { planId, billingCycle, couponCode, refCode } = await req.json();
    if (!planId) return Response.json({ error: "Missing planId" }, { status: 400 });
    if (!PLANS[planId]) return Response.json({ error: "Invalid plan" }, { status: 400 });

    let discountPercent = 0;
    if (couponCode) {
      const coupon = await get("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [couponCode]);
      if (coupon) {
        const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const maxed = coupon.max_uses > 0 && coupon.current_uses >= coupon.max_uses;
        if (!expired && !maxed) discountPercent = coupon.discount_percent || 0;
      }
    }

    let amount = getPlanPrice(planId);
    const credits = getPlanCredits(planId);
    if (discountPercent > 0) {
      amount = Math.round(amount * (100 - discountPercent)) / 100;
    }

    const userId = session.user.id || session.user.email;

    const tx = await createTransaction({
      userId,
      provider: "youcanpay",
      planId,
      billingCycle: billingCycle || "one_time",
      amount,
      credits,
      status: "pending",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://viralstudio-ai-rho.vercel.app";
    const customerIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "127.0.0.1";

    const result = await tokenizePayment({
      orderId: tx.id,
      amountMinor: Math.round(amount * 100),
      currency: "USD",
      customerIp,
      // Keep these URLs free of query params: YouCan Pay appends
      // ?transaction_id=...&order_id=...&is_success=1&code=000 on return.
      successUrl: `${appUrl}/pricing`,
      errorUrl: `${appUrl}/pricing`,
      customer: { name: session.user.name || "", email: session.user.email },
      metadata: {
        transactionId: tx.id,
        userId: String(userId),
        planId,
        billingCycle: billingCycle || "one_time",
        credits: String(credits),
        refCode: refCode || "",
      },
    });

    if (!result.ok) {
      console.error("YouCanPay tokenize failed:", result);
      await updateTransaction(tx.id, { status: "failed" });
      return Response.json({ error: result.error || "YouCanPay request failed" }, { status: result.status || 502 });
    }

    await updateTransaction(tx.id, {
      transaction_id: result.transactionId || result.tokenId,
    });

    return Response.json({
      paymentUrl: paymentFormUrl(result.tokenId),
      tokenId: result.tokenId,
      transactionId: tx.id,
      credits,
    });
  } catch (err) {
    console.error("YouCanPay create error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}