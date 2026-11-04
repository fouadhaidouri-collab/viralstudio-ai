import { auth } from "../../lib/auth";
import { get, run, query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  // Keep the user's full generation history available in Library.
  const rows = await query(
    "SELECT * FROM ai_generations WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

  let activeJobs = [];
  try {
    activeJobs = await query(
      "SELECT request_id, model_id, created_at FROM video_generation_billing WHERE user_id = ? AND status = 'pending' AND provider_id IS NOT NULL ORDER BY created_at ASC",
      [userId]
    );
  } catch {
    // The billing table is created when the first video generation is submitted.
  }

  return Response.json({ data: rows, activeJobs });
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
