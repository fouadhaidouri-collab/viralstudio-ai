import {
  getTransactionByProviderId,
  updateTransaction,
  addCreditLedgerEntry,
} from "../../../../lib/paymentTransactions";
import { addUserCredits } from "../../../../lib/pricing";
import { processCommissionForPayment } from "../../../../lib/affiliateStore";

export async function POST(req) {
  try {
    const body = await req.json();
    const eventType = body.event_type;
    const resource = body.resource;

    if (!eventType || !resource) {
      return Response.json({ received: true });
    }

    const verifyUrl = process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com/v1/notifications/verify-webhook-signature"
      : "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature";

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (clientId && secret) {
      const authStr = Buffer.from(`${clientId}:${secret}`).toString("base64");
      const tokenRes = await fetch(
        `${verifyUrl.replace("/v1/notifications/verify-webhook-signature", "/v1/oauth2/token")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${authStr}` },
          body: "grant_type=client_credentials",
        }
      );
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        const verificationRes = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenData.access_token}`,
          },
          body: JSON.stringify({
            auth_algo: req.headers.get("PAYPAL-AUTH-ALGO") || "",
            cert_url: req.headers.get("PAYPAL-CERT-URL") || "",
            transmission_id: req.headers.get("PAYPAL-TRANSMISSION-ID") || "",
            transmission_sig: req.headers.get("PAYPAL-TRANSMISSION-SIG") || "",
            transmission_time: req.headers.get("PAYPAL-TRANSMISSION-TIME") || "",
            webhook_id: process.env.PAYPAL_WEBHOOK_ID || "",
            webhook_event: body,
          }),
        });

        const verification = await verificationRes.json();
        if (verification.verification_status !== "SUCCESS") {
          console.error("PayPal webhook verification failed:", verification);
          return Response.json({ error: "Verification failed" }, { status: 403 });
        }
      }
    }

    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.id || resource.supplementary_data?.related_ids?.order_id;
      const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;

      let parsed;
      try {
        parsed = customId ? JSON.parse(customId) : null;
      } catch {
        parsed = null;
      }

      const txId = parsed?.transactionId;
      const credits = parsed?.credits || 0;

      let tx;
      if (txId) {
        tx = await updateTransaction(txId, {
          status: "completed",
          provider_payment_id: orderId,
        });
      } else {
        tx = await getTransactionByProviderId("paypal", orderId);
        if (tx) {
          await updateTransaction(tx.id, { status: "completed" });
        }
      }

      if (!tx) {
        console.error("PayPal webhook: no matching transaction for", orderId);
        return Response.json({ received: true });
      }

      const ledgerEntry = await addCreditLedgerEntry({
        userId: tx.user_id,
        transactionId: tx.id,
        creditsAdded: credits,
        reason: `PayPal payment`,
      });

      if (ledgerEntry) {
        await addUserCredits(tx.user_id, credits, "purchase", {
          transactionId: tx.id,
          provider: "paypal",
        });
        console.log(`PayPal: Added ${credits} credits to user ${tx.user_id}`);
        await processCommissionForPayment(tx.user_id, null, tx.amount);
      } else {
        console.log(`PayPal webhook: Transaction ${tx.id} already processed`);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
