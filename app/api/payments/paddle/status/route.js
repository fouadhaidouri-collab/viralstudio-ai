import { auth } from "../../../../../lib/auth";
import { getTransaction } from "../../../../../../lib/paymentTransactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("transactionId");
    if (!id) return Response.json({ error: "Missing transactionId" }, { status: 400 });
    const tx = await getTransaction(id);
    const userId = session.user.id || session.user.email;
    if (!tx || tx.provider !== "paddle" || String(tx.user_id) !== String(userId)) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }
    return Response.json({ status: tx.status, success: tx.status === "completed", credits: tx.status === "completed" ? tx.credits : 0 });
  } catch (error) {
    console.error("Paddle payment status failed:", error);
    return Response.json({ error: "Unable to check payment status" }, { status: 500 });
  }
}
