import { auth } from "../../lib/auth";
import { get, run, query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const rows = await query(
    "SELECT * FROM ai_generations WHERE user_id = ? AND created_at >= datetime('now', '-30 days') ORDER BY created_at DESC",
    [userId]
  );

  return Response.json({ data: rows });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { type, provider, model, prompt, output_url, thumbnail_url, credits_used } = await request.json();
  const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await run(
    "INSERT INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, output_url, thumbnail_url, created_at) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, datetime('now'))",
    [id, session.user.id, type, provider, model, prompt, credits_used || 0, output_url, thumbnail_url]
  );

  return Response.json({ success: true, id });
}
