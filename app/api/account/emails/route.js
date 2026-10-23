import { query, get, run } from "../../../../lib/db";
import { getServerSession } from "../../../lib/session";

const MAX_EMAILS = 3;

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.sub) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await get("SELECT id, email, email_verified FROM users WHERE id = ?", [session.sub]);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const additional = await query(
      "SELECT id, email, verified, created_at, verified_at FROM user_emails WHERE user_id = ? ORDER BY created_at ASC",
      [session.sub]
    );

    return Response.json({
      primary: { email: user.email, verified: Boolean(user.email_verified) },
      additional,
      max: MAX_EMAILS,
      remaining: Math.max(0, MAX_EMAILS - 1 - additional.length),
    });
  } catch (err) {
    console.error("account emails GET error:", err);
    return Response.json({ error: "Failed to load emails" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session?.sub) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Email id is required" }, { status: 400 });
    }

    const row = await get("SELECT id FROM user_emails WHERE id = ? AND user_id = ?", [id, session.sub]);
    if (!row) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    await run("DELETE FROM user_emails WHERE id = ? AND user_id = ?", [id, session.sub]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("account emails DELETE error:", err);
    return Response.json({ error: "Failed to remove email" }, { status: 500 });
  }
}
