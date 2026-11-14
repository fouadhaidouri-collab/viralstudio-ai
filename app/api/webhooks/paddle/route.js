import crypto from "node:crypto";
import {
  getTransaction, updateTransaction, addCreditLedgerEntry,
} from "../../../../lib/paymentTransactions";
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
  const expected = crypto.createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.h1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  const rawBody = await req.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || !validSignature(rawBody, req.headers.get("paddle-signature"), secret)) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const data = event.data || {};
    if (event.event_type === "transaction.completed") {
      const custom = data.custom_data || {};
      const transactionId = custom.transactionId;
      if (!transactionId) return Response.json({ received: true, ignored: true });

      const tx = await getTransaction(transactionId);
      if (!tx || tx.provider !== "paddle") return Response.json({ received: true, ignored: true });

      const expectedAmount = Math.round(Number(tx.amount) * 100);
      const paidAmount = Number(data.details?.totals?.total ?? data.details?.totals?.grand_total ?? NaN);
      if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount || data.currency_code !== "USD") {
        console.error("Paddle transaction amount/currency mismatch", { transactionId, expectedAmount, paidAmount, currency: data.currency_code });
        return Response.json({ error: "Transaction amount mismatch" }, { status: 409 });
      }

      const credits = Number(tx.credits || custom.credits || 0);
      const ledger = await addCreditLedgerEntry({
        userId: tx.user_id, transactionId: tx.id, creditsAdded: credits, reason: "Paddle payment",
      });
      if (ledger) {
        await addUserCredits(tx.user_id, credits, "purchase", { transactionId: tx.id, provider: "paddle" });
        await processCommissionForPayment(tx.user_id, null, tx.amount);
      }
      await updateTransaction(tx.id, { status: "completed", transaction_id: data.id });
    } else if (event.event_type === "transaction.payment_failed" || event.event_type === "transaction.canceled") {
      const transactionId = data.custom_data?.transactionId;
      if (transactionId) {
        const tx = await getTransaction(transactionId);
        if (tx && tx.provider === "paddle" && tx.status !== "completed") {
          await updateTransaction(tx.id, { status: "failed", transaction_id: data.id });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook processing failed:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
