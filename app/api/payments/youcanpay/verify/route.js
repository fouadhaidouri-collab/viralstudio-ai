import { auth } from "../../../../lib/auth";
import {
  getTransaction,
  updateTransaction,
  addCreditLedgerEntry,
  isTransactionProcessed,
} from "@/lib/paymentTransactions";
import { addUserCredits } from "@/lib/pricing";
import { fetchTransaction } from "@/lib/youcanpay";
import { processCommissionForPayment } from "@/lib/affiliateStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/payments/youcanpay/verify?transactionId=tx_xxx
//
// Called when the buyer lands back on /pricing after YouCan Pay. It confirms the
// payment with YouCan Pay directly, so credits land even if the webhook has not
// been registered yet. Credit granting is idempotent (guarded by the ledger).
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    if (!transactionId) {
      return Response.json({ error: "Missing transactionId" }, { status: 400 });
    }

    const tx = await getTransaction(transactionId);
    if (!tx) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const ownerId = session.user.id || session.user.email;
    if (String(tx.user_id) !== String(ownerId)) {
      return Response.json({ error: "Not your transaction" }, { status: 403 });
    }

    const processed = await isTransactionProcessed(tx.id);
    if (processed || tx.status === "completed") {
      return Response.json({ success: true, alreadyProcessed: true, credits: tx.credits || 0 });
    }

    if (!tx.transaction_id) {
      return Response.json({ success: false, status: tx.status, message: "Payment reference missing" });
    }

    const remote = await fetchTransaction(tx.transaction_id);
    if (!remote.ok) {
      return Response.json({ success: false, status: tx.status, message: "Could not verify payment" });
    }

    if (remote.status !== "paid") {
      return Response.json({ success: false, status: remote.status, message: "Payment not completed" });
    }

    const credits = tx.credits || 0;
    const ledgerEntry = await addCreditLedgerEntry({
      userId: tx.user_id,
      transactionId: tx.id,
      creditsAdded: credits,
      reason: "YouCanPay payment",
    });
    if (!ledgerEntry) {
      return Response.json({ success: true, alreadyProcessed: true, credits });
    }

    await updateTransaction(tx.id, { status: "completed" });
    await addUserCredits(tx.user_id, credits, "purchase", { transactionId: tx.id, provider: "youcanpay" });
    await processCommissionForPayment(tx.user_id, null, tx.amount);

    return Response.json({ success: true, credits });
  } catch (err) {
    console.error("YouCanPay verify error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
