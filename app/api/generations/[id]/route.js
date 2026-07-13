import { auth } from "@/app/lib/auth";
import { run, get } from "@/lib/db";

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await get("SELECT * FROM ai_generations WHERE id = ? AND user_id = ?", [id, session.user.id]);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await run("DELETE FROM ai_generations WHERE id = ?", [id]);
  return Response.json({ success: true });
}
