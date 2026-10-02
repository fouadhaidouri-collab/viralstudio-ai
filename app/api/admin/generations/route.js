import { query } from "../../../../lib/db";

export async function GET() {
  let rows = [];
  try {
    rows = await query(
      "SELECT g.id, g.user_id, u.name AS user_name, u.email AS user_email, g.type, g.provider, g.model, g.prompt, g.status, g.progress, g.credits_used, g.generation_time, g.output_url, g.thumbnail_url, g.created_at FROM ai_generations g LEFT JOIN users u ON g.user_id = u.id ORDER BY g.created_at DESC"
    );
  } catch { rows = []; }

  const data = rows.map((r) => ({
    ...r,
    tool: r.type || "AI Tool",
    output_file: r.output_url || null,
  }));

  return Response.json({ data, total: data.length });
}