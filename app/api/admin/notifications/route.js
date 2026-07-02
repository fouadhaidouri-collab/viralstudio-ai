import { query, run } from "../../../../lib/db";

export async function GET() {
  const notifications = await query(
    "SELECT * FROM notifications WHERE user_id = 'admin' ORDER BY created_at DESC LIMIT 20"
  );
  const unread = notifications.filter((n) => !n.is_read).length;
  return Response.json({ notifications, unread });
}

export async function PATCH(req) {
  const { id } = await req.json();
  if (id) {
    await run("UPDATE notifications SET is_read = 1 WHERE id = ?", [id]);
  } else {
    await run("UPDATE notifications SET is_read = 1 WHERE user_id = 'admin'");
  }
  return Response.json({ success: true });
}
