import { getTransaction } from "../../../../lib/paymentTransactions";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return Response.json({ error: "Missing transactionId" }, { status: 400 });
  }

  const tx = getTransaction(transactionId);
  if (!tx) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  return Response.json({
    id: tx.id,
    status: tx.status,
    provider: tx.provider,
    planId: tx.plan_id,
    billingCycle: tx.billing_cycle,
    amount: tx.amount,
    credits: tx.credits,
    createdAt: tx.created_at,
  });
}
