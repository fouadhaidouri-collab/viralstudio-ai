import { auth } from "../../lib/auth";
import { get, run, query, batch } from "@/lib/db";
import { getGeneration, normalizeStatus, outputUrl } from "@/lib/renderful";

async function reconcileVideoJob(job, userId) {
  try {
    const generation = await getGeneration(job.provider_id);
    const status = normalizeStatus(generation.status);

    if (status === "FAILED" || status === "CANCELLED") {
      await batch([
        {
          sql: "UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status IN ('held','charging')",
          params: [job.request_id, userId],
        },
        {
          sql: "UPDATE video_generation_billing SET status = 'failed' WHERE request_id = ? AND user_id = ? AND status = 'pending'",
          params: [job.request_id, userId],
        },
      ]);
      return;
    }

    if (status !== "COMPLETED") return;
    const videoUrl = outputUrl(generation);
    if (!videoUrl) return;

    const hold = await get(
      "SELECT status FROM video_credit_holds WHERE request_id = ? AND user_id = ?",
      [job.request_id, userId]
    );

    if (!hold || !["held", "charging"].includes(hold.status)) {
      await run(
        "UPDATE video_generation_billing SET status = 'completed_unpaid' WHERE request_id = ? AND user_id = ? AND status = 'pending'",
        [job.request_id, userId]
      );
    } else {
      // D1 executes this batch transactionally. Requiring billing.status='pending'
      // prevents a second concurrent reconciler from charging the same hold twice.
      await batch([
        {
          sql: "UPDATE video_credit_holds SET status = 'charging' WHERE request_id = ? AND user_id = ? AND status = 'held'",
          params: [job.request_id, userId],
        },
        {
          sql: "UPDATE credits SET current_balance = current_balance - ?, total_used = total_used + ?, updated_at = datetime('now') WHERE user_id = ? AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging') AND EXISTS (SELECT 1 FROM video_generation_billing WHERE request_id = ? AND user_id = ? AND status = 'pending')",
          params: [job.amount, job.amount, userId, job.request_id, userId, job.request_id, userId],
        },
        {
          sql: "INSERT INTO credit_ledger (id, user_id, transaction_id, credits_added, reason) SELECT ?, ?, ?, ?, 'AI Video generation' WHERE EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging') AND EXISTS (SELECT 1 FROM video_generation_billing WHERE request_id = ? AND user_id = ? AND status = 'pending') AND NOT EXISTS (SELECT 1 FROM credit_ledger WHERE transaction_id = ?)",
          params: [`video_${job.request_id}`, userId, job.request_id, -job.amount, job.request_id, userId, job.request_id, userId, job.request_id],
        },
        {
          sql: "UPDATE video_generation_billing SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging')",
          params: [job.request_id, userId, job.request_id, userId],
        },
        {
          sql: "UPDATE video_credit_holds SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'charging' AND EXISTS (SELECT 1 FROM video_generation_billing WHERE request_id = ? AND user_id = ? AND status = 'charged')",
          params: [job.request_id, userId, job.request_id, userId],
        },
      ]);
    }

    const finalBilling = await get(
      "SELECT status, amount, model_id, prompt, provider FROM video_generation_billing WHERE request_id = ? AND user_id = ?",
      [job.request_id, userId]
    );
    if (["charged", "completed_unpaid"].includes(finalBilling?.status)) {
      await run(
        "INSERT OR IGNORE INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, output_url, thumbnail_url, created_at) VALUES (?, ?, 'AI Video', ?, ?, ?, 'completed', ?, ?, ?, datetime('now'))",
        [
          `video_${job.request_id}`,
          userId,
          finalBilling.provider || "Renderful",
          finalBilling.model_id,
          finalBilling.prompt || "",
          finalBilling.status === "charged" ? finalBilling.amount || 0 : 0,
          videoUrl,
          videoUrl,
        ]
      );
    }
  } catch (error) {
    // A provider/network hiccup must not hide the job or break Library loading.
    console.error("Library video reconciliation failed:", {
      requestId: job.request_id,
      message: error.message,
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
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

    // Re-check recent pending tasks against Renderful when Library is opened.
    // This makes completed videos persist even if the customer left AI Video
    // before its polling request or the provider webhook was delivered.
    const pendingJobs = await query(
      "SELECT request_id, provider_id, amount FROM video_generation_billing WHERE user_id = ? AND status = 'pending' AND provider_id IS NOT NULL AND created_at >= datetime('now', '-12 hours') ORDER BY created_at ASC LIMIT 20",
      [userId]
    );
    for (const job of pendingJobs) {
      await reconcileVideoJob(job, userId);
    }

    activeJobs = await query(
      "SELECT request_id, model_id, created_at FROM video_generation_billing WHERE user_id = ? AND status = 'pending' AND provider_id IS NOT NULL AND created_at >= datetime('now', '-12 hours') ORDER BY created_at ASC",
      [userId]
    );
  } catch (error) {
    console.error("Library video recovery check failed:", error.message);
  }

  // Read after reconciliation so newly completed videos appear immediately.
  const rows = await query(
    "SELECT * FROM ai_generations WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

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
