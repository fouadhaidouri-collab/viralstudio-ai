import { auth } from "../../../../lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the current user's recently pending YouCan Pay orders so the pricing
// page can re-check them. Covers payments that settled after the buyer closed
// the tab or lost the return URL.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;
    const rows = await query(
      "SELECT id FROM payments WHERE user_id = ? AND provider = 'youcanpay' AND status = 'pending' AND created_at >= datetime('now', '-6 hours') ORDER BY created_at DESC LIMIT 3",
      [userId]
    );

    return Response.json({ orders: (rows || []).map((row) => row.id) });
  } catch (err) {
    console.error("youcanpay pending error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
