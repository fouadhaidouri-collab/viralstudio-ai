import Stripe from "stripe";
import {
  getTransactionByProviderId,
  updateTransaction,
  addCreditLedgerEntry,
} from "../../../../lib/paymentTransactions";
import { addUserCredits } from "../../../../lib/pricing";
import { processCommissionForPayment } from "../../../../lib/affiliateStore";

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const buf = await req.arrayBuffer();
    const raw = Buffer.from(buf);

    let event;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (err) {
      console.error("Stripe signature verification failed:", err.message);
      return Response.json({ error: "Signature verification failed" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const transactionId = session.metadata?.transactionId;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || "0", 10);
      const providerPaymentId = session.id;

      let tx;
      if (transactionId) {
        tx = updateTransaction(transactionId, {
          status: "completed",
          provider_payment_id: providerPaymentId,
          raw_payload: event,
        });
      } else {
        tx = getTransactionByProviderId("stripe", providerPaymentId);
        if (tx) {
          updateTransaction(tx.id, { status: "completed", raw_payload: event });
        }
      }

      if (!tx) {
        console.error("Stripe webhook: no matching transaction for", providerPaymentId);
        return Response.json({ received: true });
      }

      // Idempotency check
      const ledgerEntry = addCreditLedgerEntry({
        userId: tx.user_id,
        transactionId: tx.id,
        creditsAdded: credits,
        reason: `Stripe payment for ${tx.plan_id} plan (${tx.billing_cycle})`,
      });

      if (ledgerEntry) {
        addUserCredits(tx.user_id, credits, "purchase", {
          transactionId: tx.id,
          provider: "stripe",
          planId: tx.plan_id,
        });
        console.log(`Stripe: Added ${credits} credits to user ${tx.user_id}`);
        processCommissionForPayment(tx.user_id, tx.plan_id, tx.amount);
      } else {
        console.log(`Stripe webhook: Transaction ${tx.id} already processed (idempotent)`);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
