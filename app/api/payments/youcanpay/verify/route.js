import { auth } from "../../../../lib/auth";
import {
  getTransaction,
  getTransactionByProviderId,
  updateTransaction,
  addCreditLedgerEntry,
  isTransactionProcessed,
} from "@/lib/paymentTransactions";
import { addUserCredits } from "@/lib/pricing";
import { fetchTransaction } from "@/lib/youcanpay";
import { processCommissionForPayment } from "@/lib/affiliateStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Right after YouCan Pay redirects the buyer back, its transaction can still be
// marked "pending" for a few seconds while the charge settles. Poll briefly so
// the first return credits the account instead of asking the buyer to retry.
async function waitForPaid(transactionId) {
  let last = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    last = await fetchTransaction(transactionId);
    if (last.ok) {
      if (last.status === "paid") return last;
      if (["failed", "canceled", "refunded"].includes(last.status)) return last;
    }
    if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return last;
}

// GET /api/payments/youcanpay/verify?orderId=<our tx id>&providerTransactionId=<youcanpay tx id>
//
// YouCan Pay sends the buyer back to success_url with:
//   ?transaction_id=<youcanpay id>&order_id=<our tx id>&is_success=1&code=000
// so we confirm the payment directly with YouCan Pay. Crediting is idempotent
// (guarded by the credit ledger).
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId") || searchParams.get("transactionId");
    const providerTransactionId =
      searchParams.get("providerTransactionId") || searchParams.get("provider_transaction_id");
    const isSuccess = searchParams.get("is_success");

    if (!orderId && !providerTransactionId) {
      return Response.json({ error: "Missing transaction reference" }, { status: 400 });
    }
    if (isSuccess === "0") {
      return Response.json({ success: false, status: "failed", message: "Payment was cancelled or failed" });
    }

    let tx = orderId ? await getTransaction(orderId) : null;
    if (!tx && providerTransactionId) {
      tx = await getTransactionByProviderId("youcanpay", providerTransactionId);
    }
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

    // Prefer the YouCan Pay transaction id from the return URL. The value stored
    // at tokenize time may be the payment token id, which cannot be looked up.
    const ycpId = providerTransactionId || tx.transaction_id;
    if (!ycpId) {
      return Response.json({
        success: false,
        pending: true,
        status: tx.status,
        message: "Payment received — waiting for confirmation",
      });
    }

    const remote = await waitForPaid(ycpId);
    if (!remote?.ok) {
      return Response.json({
        success: false,
        pending: true,
        status: tx.status,
        message: "Payment received — confirming with YouCan Pay",
      });
    }

    if (remote.status !== "paid") {
      const pending = remote.status === "pending" || remote.status === "authorized";
      return Response.json({
        success: false,
        pending,
        status: remote.status,
        message: pending
          ? "Payment received — waiting for confirmation"
          : "Payment not completed",
      });
    }

    // If YouCan Pay echoes our order id, it must match the transaction we know.
    if (remote.orderId && String(remote.orderId) !== String(tx.id)) {
      return Response.json({ error: "Order mismatch" }, { status: 409 });
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

    await updateTransaction(tx.id, { status: "completed", transaction_id: ycpId });
    await addUserCredits(tx.user_id, credits, "purchase", {
      transactionId: tx.id,
      provider: "youcanpay",
    });
    await processCommissionForPayment(tx.user_id, null, tx.amount);

    return Response.json({ success: true, credits });
  } catch (err) {
    console.error("YouCanPay verify error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
