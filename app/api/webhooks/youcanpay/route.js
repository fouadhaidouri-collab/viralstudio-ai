import { getTransaction, getTransactionByProviderId, updateTransaction, addCreditLedgerEntry } from "@/lib/paymentTransactions";
import { addUserCredits } from "@/lib/pricing";
import { verifyWebhookSignature } from "@/lib/youcanpay";
import { getAffiliateByReferralCode, createReferral, processCommissionForPayment } from "@/lib/affiliateStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/webhooks/youcanpay
//
// YouCan Pay IPN. Register this URL in the YouCan Pay dashboard:
//   https://<your-domain>/api/webhooks/youcanpay
//
// Payload shape:
//   { event_name: "transaction.paid", payload: { transaction: { id, status, order_id },
//     metadata: { transactionId, credits, refCode } } }
export async function POST(req) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-youcanpay-signature") || "";

    if (!verifyWebhookSignature(raw, signature)) {
      console.warn("YouCanPay webhook: invalid or missing signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const eventName = String(body.event_name || "");
    const txData = (body.payload && body.payload.transaction) || {};
    const metadata = (body.payload && body.payload.metadata) || {};
    const orderId = txData.order_id || metadata.transactionId || metadata.order_id;

    let tx = null;
    if (orderId) {
      tx = await getTransaction(orderId);
      if (!tx && txData.id) tx = await getTransactionByProviderId("youcanpay", String(txData.id));
    }

    if (eventName === "transaction.paid" || eventName === "transaction.success") {
      if (!tx) {
        console.error("YouCanPay webhook: no transaction for order", orderId);
        return Response.json({ received: true });
      }

      const credits = metadata.credits ? parseInt(metadata.credits, 10) : (tx.credits || 0);

      const ledgerEntry = await addCreditLedgerEntry({
        userId: tx.user_id,
        transactionId: tx.id,
        creditsAdded: credits,
        reason: "YouCanPay payment",
      });
      if (!ledgerEntry) {
        console.log("YouCanPay webhook: transaction already processed", tx.id);
        return Response.json({ received: true, alreadyProcessed: true });
      }

      await updateTransaction(tx.id, { status: "completed", transaction_id: txData.id || tx.transaction_id });
      await addUserCredits(tx.user_id, credits, "purchase", { transactionId: tx.id, provider: "youcanpay" });
      console.log(`YouCanPay: added ${credits} credits to ${tx.user_id}`);

      let commissionProcessed = await processCommissionForPayment(tx.user_id, null, tx.amount);
      if (!commissionProcessed && metadata.refCode) {
        const affiliate = await getAffiliateByReferralCode(metadata.refCode);
        if (affiliate && affiliate.user_id !== tx.user_id) {
          const referral = await createReferral({ affiliate_id: affiliate.id, referred_user_id: tx.user_id });
          if (referral && !referral.error) {
            await processCommissionForPayment(tx.user_id, null, tx.amount);
          }
        }
      }

      return Response.json({ received: true, credited: true });
    }

    if (eventName === "transaction.failed" || eventName === "transaction.cancelled") {
      if (tx) await updateTransaction(tx.id, { status: "failed" });
      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("YouCanPay webhook error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}