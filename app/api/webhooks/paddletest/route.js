import crypto from "node:crypto";
import { getTransaction, updateTransaction, addCreditLedgerEntry } from "../../../../lib/paymentTransactions";
import { addUserCredits } from "../../../../lib/pricing";
import { processCommissionForPayment } from "../../../../lib/affiliateStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    return index > -1 ? [part.slice(0, index), part.slice(index + 1)] : ["", ""];
  }));
  if (!parts.ts || !parts.h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts.ts + ":" + rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.h1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  const rawBody = await req.text();
  const secret = process.env.PADDLE_TEST_WEBHOOK_SECRET;
  if (process.env.PADDLE_ENVIRONMENT !== "sandbox" || !secret) {
    return Response.json({ error: "Sandbox webhook is not configured" }, { status: 503 });
  }
  if (!validSignature(rawBody, req.headers.get("paddle-signature"), secret)) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const data = event.data || {};
    const customData = data.custom_data || {};
    const localTransactionId = customData.transactionId;
    if (!localTransactionId) return Response.json({ received: true, ignored: true });

    const tx = await getTransaction(localTransactionId);
    if (!tx || tx.provider !== "paddle_sandbox") return Response.json({ received: true, ignored: true });

    if (event.event_type === "transaction.completed") {
      if (tx.status === "completed") return Response.json({ received: true, alreadyProcessed: true });

      const expectedSubtotal = Math.round(Number(tx.amount) * 100);
      const actualSubtotal = Number(data.details?.totals?.subtotal ?? NaN);
      if (!Number.isFinite(actualSubtotal) || actualSubtotal !== expectedSubtotal ||
          data.currency_code !== "USD" || data.status !== "completed") {
        console.error("Paddle Sandbox transaction validation failed", {
          localTransactionId, paddleTransactionId: data.id, expectedSubtotal,
          actualSubtotal, currency: data.currency_code, status: data.status,
        });
        return Response.json({ error: "Transaction validation failed" }, { status: 409 });
      }

      const credits = Number(tx.credits || customData.credits || 0);
      if (!Number.isSafeInteger(credits) || credits <= 0) {
        return Response.json({ error: "Invalid credit quantity" }, { status: 409 });
      }

      const ledgerEntry = await addCreditLedgerEntry({
        userId: tx.user_id, transactionId: tx.id, creditsAdded: credits,
        reason: "Paddle Sandbox payment",
      });
      if (ledgerEntry) {
        await addUserCredits(tx.user_id, credits, "purchase", {
          transactionId: tx.id, provider: "paddle_sandbox",
        });
        await processCommissionForPayment(tx.user_id, null, tx.amount);
      }
      await updateTransaction(tx.id, { status: "completed", transactionId: data.id });
    } else if (event.event_type === "transaction.payment_failed" || event.event_type === "transaction.canceled") {
      if (tx.status !== "completed") {
        await updateTransaction(tx.id, { status: "failed", transactionId: data.id || tx.transaction_id });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Paddle Sandbox webhook processing failed:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
