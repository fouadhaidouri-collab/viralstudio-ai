import { get, run, batch } from "@/lib/db";

async function ensureVideoDiagnosticColumns() {
  for (const column of [
    ["error_message", "TEXT"],
    ["provider_status", "TEXT"],
    ["prediction_id", "TEXT"],
  ]) {
    try {
      await run(`ALTER TABLE ai_generations ADD COLUMN ${column[0]} ${column[1]}`);
    } catch {}
  }
}

function safeProviderError(value) {
  const raw = value?.message || value?.error?.message || value?.error ||
    value?.failure_reason || value?.error_message || value?.message || value ||
    "The provider marked this generation as failed without a reason.";
  return String(raw)
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|token|secret)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 1000);
}

async function saveFailedVideoGeneration({ requestId, userId, provider, model, prompt, providerId, status, error }) {
  await ensureVideoDiagnosticColumns();
  await run(
    "INSERT OR IGNORE INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, error_message, provider_status, prediction_id, created_at) VALUES (?, ?, 'AI Video', ?, ?, ?, 'failed', 0, ?, ?, ?, datetime('now'))",
    [`video_${requestId}`, userId, provider || "Renderful", model || "", prompt || "", safeProviderError(error), status || "FAILED", providerId || null]
  );
}
import { getGeneration, normalizeStatus, outputUrl } from "@/lib/renderful";
 
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const providerId = String(payload?.data?.id || "").trim();
  if (!providerId) {
    return Response.json({ error: "Missing provider generation ID." }, { status: 400 });
  }

  // Match the provider task to a generation submitted by this application.
  // Fetch the task from Renderful using our server-side key before trusting
  // the callback payload or changing a customer's credits.
  const billing = await get(
    "SELECT * FROM video_generation_billing WHERE provider_id = ?",
    [providerId]
  );
  if (!billing) {
    // Image generations are stored directly in ai_generations and share this
    // webhook endpoint. Verify the provider state before updating their record.
    await ensureVideoDiagnosticColumns();
    const imageJob = await get(
      "SELECT * FROM ai_generations WHERE prediction_id = ? AND LOWER(type) LIKE '%image%'",
      [providerId]
    );
    if (!imageJob) return Response.json({ received: true, ignored: true });

    let imageGeneration;
    try {
      imageGeneration = await getGeneration(providerId);
    } catch (error) {
      console.error("Renderful image webhook verification failed:", error.message);
      return Response.json({ error: "Could not verify provider generation." }, { status: 503 });
    }

    const imageStatus = normalizeStatus(imageGeneration.status);
    if (imageStatus === "COMPLETED") {
      const imageUrl = outputUrl(imageGeneration);
      if (!imageUrl) return Response.json({ error: "Completed image has no output URL." }, { status: 503 });
      await run(
        "UPDATE ai_generations SET status = 'completed', output_url = ?, thumbnail_url = ?, provider_status = ? WHERE id = ?",
        [imageUrl, imageUrl, imageStatus, imageJob.id]
      );
    } else if (imageStatus === "FAILED" || imageStatus === "CANCELLED") {
      await run(
        "UPDATE ai_generations SET status = 'failed', error_message = ?, provider_status = ? WHERE id = ?",
        [safeProviderError(imageGeneration), imageStatus, imageJob.id]
      );
    }
    return Response.json({ received: true, status: imageStatus });
  }

  let generation;
  try {
    generation = await getGeneration(providerId);
  } catch (error) {
    console.error("Renderful webhook verification failed:", error.message);
    return Response.json({ error: "Could not verify provider generation." }, { status: 503 });
  }

  const status = normalizeStatus(generation.status);
  if (status === "COMPLETED") {
    const videoUrl = outputUrl(generation);
    if (!videoUrl) {
      return Response.json({ error: "Completed generation has no output URL." }, { status: 503 });
    }

    if (billing.status === "pending") {
      const hold = await get(
        "SELECT status FROM video_credit_holds WHERE request_id = ? AND user_id = ?",
        [billing.request_id, billing.user_id]
      );

      if (!hold || !["held", "charging"].includes(hold.status)) {
        await run(
          "UPDATE video_generation_billing SET status = 'completed_unpaid' WHERE request_id = ? AND user_id = ? AND status = 'pending'",
          [billing.request_id, billing.user_id]
        );
      } else {
        try {
          await batch([
            {
              sql: "UPDATE video_credit_holds SET status = 'charging' WHERE request_id = ? AND user_id = ? AND status = 'held'",
              params: [billing.request_id, billing.user_id],
            },
            {
              sql: "UPDATE credits SET current_balance = current_balance - ?, total_used = total_used + ?, updated_at = datetime('now') WHERE user_id = ? AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging')",
              params: [billing.amount, billing.amount, billing.user_id, billing.request_id, billing.user_id],
            },
            {
              sql: "INSERT INTO credit_ledger (id, user_id, transaction_id, credits_added, reason) SELECT ?, ?, ?, ?, 'AI Video generation' WHERE EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging') AND NOT EXISTS (SELECT 1 FROM credit_ledger WHERE transaction_id = ?)",
              params: [`video_${billing.request_id}`, billing.user_id, billing.request_id, -billing.amount, billing.request_id, billing.user_id, billing.request_id],
            },
            {
              sql: "UPDATE video_generation_billing SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging')",
              params: [billing.request_id, billing.user_id, billing.request_id, billing.user_id],
            },
            {
              sql: "UPDATE video_credit_holds SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'charging'",
              params: [billing.request_id, billing.user_id],
            },
          ]);
        } catch (error) {
          console.error("Renderful webhook credit settlement failed:", error.message);
          return Response.json({ error: "Credit settlement failed; webhook can be retried." }, { status: 503 });
        }
      }
    }

    const finalBilling = await get(
      "SELECT status, amount, model_id, prompt, provider FROM video_generation_billing WHERE request_id = ? AND user_id = ?",
      [billing.request_id, billing.user_id]
    );
    if (["charged", "completed_unpaid"].includes(finalBilling?.status)) {
      await run(
        "INSERT INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, output_url, thumbnail_url, created_at) VALUES (?, ?, 'AI Video', ?, ?, ?, 'completed', ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET status = 'completed', credits_used = excluded.credits_used, output_url = excluded.output_url, thumbnail_url = excluded.thumbnail_url",
        [
          `video_${billing.request_id}`,
          billing.user_id,
          finalBilling.provider || "Renderful",
          finalBilling.model_id,
          finalBilling.prompt || "",
          finalBilling.status === "charged" ? finalBilling.amount || 0 : 0,
          videoUrl,
          videoUrl,
        ]
      );
    }

    return Response.json({ received: true, status: "COMPLETED" });
  }

  if (status === "FAILED" || status === "CANCELLED") {
    await batch([
      {
        sql: "UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status IN ('held','charging')",
        params: [billing.request_id, billing.user_id],
      },
      {
        sql: "UPDATE video_generation_billing SET status = 'failed' WHERE request_id = ? AND user_id = ? AND status = 'pending'",
        params: [billing.request_id, billing.user_id],
      },
    ]);
    await saveFailedVideoGeneration({
      requestId: billing.request_id, userId: billing.user_id,
      provider: billing.provider || "Renderful", model: billing.model_id,
      prompt: billing.prompt, providerId, status, error: generation,
    }).catch((error) => console.error("Could not save failed video generation:", error.message));
    console.error("Renderful video generation failed:", {
      providerId,
      modelId: billing.model_id,
      providerError: generation.error?.message || generation.error || null,
    });
    return Response.json({ received: true, status });
  }

  // Ignore intermediate events. Renderful sends another callback at completion.
  return Response.json({ received: true, status });
}
