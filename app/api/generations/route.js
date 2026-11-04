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
    await run(`CREATE TABLE IF NOT EXISTS video_credit_holds (
      request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'held', created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    // Jobs left pending for more than 12 hours are stale, not active UI work.
    // Release only their still-held credits; never charge them during cleanup.
    await run(
      "UPDATE video_generation_billing SET status = 'expired' WHERE user_id = ? AND status = 'pending' AND created_at < datetime('now', '-12 hours')",
      [userId]
    );
    await run(
      "UPDATE video_credit_holds SET status = 'released' WHERE user_id = ? AND status IN ('held','charging') AND request_id IN (SELECT request_id FROM video_generation_billing WHERE user_id = ? AND status = 'expired')",
      [userId, userId]
    );
    activeJobs = await query(
      "SELECT request_id, model_id, created_at FROM video_generation_billing WHERE user_id = ? AND status = 'pending' AND provider_id IS NOT NULL AND created_at >= datetime('now', '-12 hours') ORDER BY created_at ASC",
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
