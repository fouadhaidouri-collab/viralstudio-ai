import { auth } from "../../../lib/auth";
import {
  getTransaction,
  getTransactionByProviderId,
  updateTransaction,
  addCreditLedgerEntry,
} from "../../../../lib/paymentTransactions";
import { addUserCredits } from "../../../../lib/pricing";
import { processCommissionForPayment } from "../../../../lib/affiliateStore";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { orderID } = await req.json();
    if (!orderID) {
      return Response.json({ error: "Missing orderID" }, { status: 400 });
    }

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

    const captureRes = await fetch(`${paypalBase}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const captureData = await captureRes.json();
    if (!captureRes.ok) {
      console.error("PayPal capture error:", captureData);
      return Response.json({ error: captureData.message || "Capture failed" }, { status: captureRes.status });
    }

    if (captureData.status !== "COMPLETED") {
      return Response.json({ error: `PayPal capture status: ${captureData.status}` }, { status: 400 });
    }

    let tx = await getTransactionByProviderId("paypal", orderID);

    if (!tx) {
      const customId = captureData.purchase_units?.[0]?.custom_id;
      if (customId) {
        try {
          const parsed = JSON.parse(customId);
          tx = await getTransaction(parsed.transactionId);
        } catch {}
      }
    }

    if (!tx) {
      console.error("PayPal capture: no matching transaction for", orderID);
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const ledgerEntry = await addCreditLedgerEntry({
      userId: tx.user_id,
      transactionId: tx.id,
      creditsAdded: tx.credits || 0,
      reason: `PayPal payment`,
    });

    if (!ledgerEntry) {
      return Response.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment already processed. Credits were added previously.",
      });
    }

    await updateTransaction(tx.id, { status: "completed" });

    await addUserCredits(tx.user_id, tx.credits || 0, "purchase", {
      transactionId: tx.id,
      provider: "paypal",
    });

    console.log(`PayPal capture: Added ${tx.credits} credits to user ${tx.user_id}`);
    await processCommissionForPayment(tx.user_id, null, tx.amount);

    return Response.json({
      success: true,
      credits: tx.credits,
    });
  } catch (err) {
    console.error("PayPal capture error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
