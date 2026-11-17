import crypto from "node:crypto";
import { getTransaction, updateTransaction } from "../../../../lib/paymentTransactions";

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
  const secret = process.env.PADDLE_TEST_WEBHOOK_SECRET;
  if (!secret || !validSignature(rawBody, req.headers.get("paddle-signature"), secret)) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const data = event.data || {};
    const transactionId = data.custom_data?.transactionId;
    if (!transactionId) return Response.json({ received: true, ignored: true });

    const tx = await getTransaction(transactionId);
    if (!tx || tx.provider !== "paddle_sandbox") {
      return Response.json({ received: true, ignored: true });
    }

    if (event.event_type === "transaction.completed") {
      const expectedAmount = Math.round(Number(tx.amount) * 100);
      const paidAmount = Number(data.details?.totals?.subtotal ?? NaN);
      if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount || data.currency_code !== "USD") {
        console.error("Paddle Sandbox transaction amount/currency mismatch", {
          transactionId, expectedAmount, paidAmount, currency: data.currency_code,
        });
        return Response.json({ error: "Transaction amount mismatch" }, { status: 409 });
      }
      await updateTransaction(tx.id, { status: "completed", transaction_id: data.id });
    } else if (
      event.event_type === "transaction.payment_failed" ||
      event.event_type === "transaction.canceled"
    ) {
      if (tx.status !== "completed") {
        await updateTransaction(tx.id, { status: "failed", transaction_id: data.id });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Paddle Sandbox webhook processing failed:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
