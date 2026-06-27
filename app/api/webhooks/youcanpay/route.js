import {
  getTransactionByProviderId,
  updateTransaction,
  addCreditLedgerEntry,
} from "../../../../lib/paymentTransactions";
import { addUserCredits } from "../../../../lib/pricing";
import { processCommissionForPayment } from "../../../../lib/affiliateStore";

export async function POST(req) {
  try {
    const raw = await req.text();
    const body = JSON.parse(raw);

    // YouCanPay sends IPN with payment data
    const paymentId = body.id || body.payment_id;
    const status = body.status || body.payment_status;
    const orderId = body.order_id;
    const metadata = body.metadata || {};

    if (!paymentId) {
      return Response.json({ received: true });
    }

    // Verify IPN with YouCanPay API
    const privateKey = process.env.YOUCANPAY_PRIVATE_KEY;
    if (privateKey) {
      const isSandbox = privateKey.includes("sandbox");
      const baseUrl = isSandbox ? "https://sandbox.youcanpay.com" : "https://youcanpay.com";

      const verifyRes = await fetch(`${baseUrl}/api/payment/${paymentId}`, {
        headers: { "API-KEY": privateKey },
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.status !== "completed") {
        console.log("YouCanPay IPN: payment not yet completed or verification failed");
        return Response.json({ received: true });
      }
    }

    if (status === "completed" || status === "success") {
      const txId = metadata?.transactionId || orderId;

      let tx;
      if (txId && txId.startsWith("tx_")) {
        tx = updateTransaction(txId, {
          status: "completed",
          provider_payment_id: paymentId,
          raw_payload: body,
        });
      } else {
        tx = getTransactionByProviderId("youcanpay", paymentId);
        if (tx) {
          updateTransaction(tx.id, { status: "completed", raw_payload: body });
        }
      }

      if (!tx) {
        console.error("YouCanPay webhook: no matching transaction for", paymentId);
        return Response.json({ received: true });
      }

      const credits = metadata?.credits ? parseInt(metadata.credits, 10) : tx.credits || 0;

      const ledgerEntry = addCreditLedgerEntry({
        userId: tx.user_id,
        transactionId: tx.id,
        creditsAdded: credits,
        reason: `YouCanPay payment for ${tx.plan_id} plan (${tx.billing_cycle})`,
      });

      if (ledgerEntry) {
        addUserCredits(tx.user_id, credits, "purchase", {
          transactionId: tx.id,
          provider: "youcanpay",
          planId: tx.plan_id,
        });
        console.log(`YouCanPay: Added ${credits} credits to user ${tx.user_id}`);
        processCommissionForPayment(tx.user_id, tx.plan_id, tx.amount);
      } else {
        console.log(`YouCanPay webhook: Transaction ${tx.id} already processed`);
      }
    } else if (status === "failed" || status === "cancelled") {
      const txId = metadata?.transactionId || orderId;
      if (txId && txId.startsWith("tx_")) {
        updateTransaction(txId, { status: "failed", raw_payload: body });
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("YouCanPay webhook error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
