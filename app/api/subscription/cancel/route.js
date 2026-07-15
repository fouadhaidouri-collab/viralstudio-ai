import { auth } from "../../../lib/auth";
import { run } from "../../../../lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await run(
      "UPDATE user_subscriptions SET status = 'canceled', auto_renew = 0, updated_at = datetime('now') WHERE user_id = ? AND status = 'active'",
      [session.user.id]
    );

    return Response.json({ success: true, message: "Subscription canceled. Access continues until the end of the billing period." });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
