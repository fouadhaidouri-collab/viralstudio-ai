import { auth } from "../../lib/auth";
import Stripe from "stripe";
import {
  PLANS,
  getPlanPrice,
  getPlanCredits,
  createTransaction,
  updateTransaction,
} from "../../../lib/paymentTransactions";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { provider, planId, billingCycle, refCode } = await req.json();

    if (!provider || !planId || !billingCycle) {
      return Response.json({ error: "Missing provider, planId, or billingCycle" }, { status: 400 });
    }

    if (!PLANS[planId]) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const annual = billingCycle === "annual";
    const amount = getPlanPrice(planId, annual);
    const credits = getPlanCredits(planId, annual);
    const creditsPerMonth = PLANS[planId].creditsPerMonth;
    const userId = session.user.email;

    const tx = createTransaction({
      userId,
      provider,
      planId,
      billingCycle,
      amount,
      credits,
      status: "pending",
    });

    // ——— STRIPE CHECKOUT ———
    if (provider === "stripe") {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return Response.json({ error: "Stripe not configured" }, { status: 500 });
      }
      const stripe = new Stripe(stripeSecretKey);

      const description = annual
        ? `${PLANS[planId].name} Plan - Annual (${credits} credits/year)`
        : `${PLANS[planId].name} Plan - Monthly (${creditsPerMonth} credits/month)`;

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: session.user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${PLANS[planId].name} Plan - ${annual ? "Annual" : "Monthly"}`,
                description,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          transactionId: tx.id,
          userId,
          planId,
          billingCycle,
          credits: String(credits),
          refCode: refCode || "",
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/success?transactionId=${tx.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/cancel?transactionId=${tx.id}`,
      });

      updateTransaction(tx.id, { provider_payment_id: checkoutSession.id });
      return Response.json({ checkoutUrl: checkoutSession.url, transactionId: tx.id });
    }

    // ——— PAYPAL CHECKOUT ———
    if (provider === "paypal") {
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
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${authStr}` },
        body: "grant_type=client_credentials",
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("PayPal auth error:", tokenData);
        return Response.json({ error: `PayPal auth failed: ${tokenData.error_description || tokenData.error || "unknown"}` }, { status: 500 });
      }

      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: tx.id,
              description: `${PLANS[planId].name} Plan - ${annual ? "Annual" : "Monthly"}`,
              amount: { currency_code: "USD", value: amount.toFixed(2) },
              custom_id: JSON.stringify({ transactionId: tx.id, userId, planId, billingCycle, credits, refCode: refCode || "" }),
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/success?transactionId=${tx.id}`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/cancel?transactionId=${tx.id}`,
              },
            },
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        console.error("PayPal order error:", orderData);
        return Response.json({ error: orderData.message || "PayPal order failed" }, { status: orderRes.status });
      }

      updateTransaction(tx.id, { provider_payment_id: orderData.id });
      const approvalUrl = orderData.links?.find((l) => l.rel === "payer-action")?.href;
      return Response.json({ checkoutUrl: approvalUrl, orderId: orderData.id, transactionId: tx.id });
    }

    // ——— YOUCANPAY CHECKOUT ———
    if (provider === "youcanpay") {
      const privateKey = process.env.YOUCANPAY_PRIVATE_KEY;
      if (!privateKey) {
        return Response.json({ error: "YouCanPay not configured" }, { status: 500 });
      }

      const isSandbox = privateKey.includes("sandbox");
      const baseUrl = isSandbox ? "https://sandbox.youcanpay.com" : "https://youcanpay.com";

      const body = {
        amount: Math.round(amount * 100),
        currency: "USD",
        order_id: tx.id,
        customer: { name: session.user.name || "", email: session.user.email },
        metadata: { transactionId: tx.id, userId, planId, billingCycle, credits: String(credits), refCode: refCode || "" },
        url: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/success?transactionId=${tx.id}`,
          cancel: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/cancel?transactionId=${tx.id}`,
          ipn: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/youcanpay`,
        },
      };

      const res = await fetch(`${baseUrl}/api/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "API-KEY": privateKey },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("YouCanPay error:", data);
        return Response.json({ error: data.message || "YouCanPay request failed" }, { status: res.status });
      }

      updateTransaction(tx.id, { provider_payment_id: data.id });
      return Response.json({ checkoutUrl: data.redirect_url || data.url, paymentId: data.id, transactionId: tx.id });
    }

    return Response.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (err) {
    console.error("Create checkout error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
