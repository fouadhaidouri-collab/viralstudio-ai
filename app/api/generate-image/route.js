import { auth } from "@/app/lib/auth";
import { get, run } from "@/lib/db";
import { imageAspectRatios, imageModels } from "@/app/lib/capabilities";
import { getGeneration, normalizeStatus, outputUrl, submitGeneration } from "@/lib/renderful";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

const MODEL_BY_ID = Object.fromEntries(imageModels.map((m) => [m.model_id, m]));
const ASPECT_BY_LABEL = Object.fromEntries(
  imageAspectRatios.map((ar) => [ar.label, ar.api || ar.label])
);

async function ensureImageDiagnosticColumns() {
  for (const [column, type] of [["error_message", "TEXT"], ["provider_status", "TEXT"], ["prediction_id", "TEXT"]]) {
    try { await run(`ALTER TABLE ai_generations ADD COLUMN ${column} ${type}`); } catch {}
  }
}

function safeProviderError(value) {
  const raw = value?.message || value?.error?.message || value?.error ||
    value?.failure_reason || value?.error_message || value ||
    "The provider marked this image generation as failed without a reason.";
  return String(raw)
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|token|secret)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 1000);
}

async function saveImageJob({ id, userId, model, prompt, status, providerId, error }) {
  await ensureImageDiagnosticColumns();
  await run(
    "INSERT INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, error_message, provider_status, prediction_id, created_at) VALUES (?, ?, 'Image Lab', ?, ?, ?, ?, 0, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET status = excluded.status, error_message = excluded.error_message, provider_status = excluded.provider_status, prediction_id = COALESCE(excluded.prediction_id, ai_generations.prediction_id)",
    [id, userId, model?.provider || "Renderful", model?.model_id || "", prompt || "", status, error ? safeProviderError(error) : null, status.toUpperCase(), providerId || null]
  );
}

function normalizeAspectRatio(value) {
  if (!value) return null;
  if (ASPECT_BY_LABEL[value]) return ASPECT_BY_LABEL[value];
  const match = String(value).match(/(\d+)\s*:\s*(\d+)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function buildImagePayload({ model, prompt, aspectRatio, resolution, origin }) {
  const payload = { type: "text-to-image", model: model.model_id, prompt };
  const ratio = normalizeAspectRatio(aspectRatio);
  if (ratio) payload.aspect_ratio = ratio;
  if (resolution) payload.resolution = String(resolution).toLowerCase();
  payload.webhook_url = `${origin}/api/webhooks/renderful`;
  return payload;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Please sign in to generate an image." }, { status: 401 });

  const { prompt, modelId, aspectRatio, resolution } = body || {};
  const model = MODEL_BY_ID[modelId];
  if (!model) return Response.json({ error: "Unsupported model." }, { status: 400 });
  if (!prompt || !String(prompt).trim()) return Response.json({ error: "Write a prompt first." }, { status: 400 });

  const userId = session.user.id;
  const requestKey = crypto.randomUUID();
  const recordId = `image_${requestKey}`;
  const cleanPrompt = String(prompt).trim();
  const payload = buildImagePayload({
    model, prompt: cleanPrompt, aspectRatio, resolution,
    origin: new URL(request.url).origin,
  });

  let data;
  try {
    data = await submitGeneration(payload);
  } catch (err) {
    await saveImageJob({ id: recordId, userId, model, prompt: cleanPrompt, status: "failed", error: err.message })
      .catch((saveError) => console.error("Could not save failed Image Lab generation:", saveError.message));
    if (err.code === "NO_KEY") {
      return Response.json({ error: "Generation service is not configured yet.", setupRequired: true }, { status: 503 });
    }
    console.error("generate-image Renderful submit error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE, noCreditsCharged: true }, { status: err.status && err.status < 500 ? 400 : 503 });
  }

  if (!data?.id) {
    await saveImageJob({ id: recordId, userId, model, prompt: cleanPrompt, status: "failed", error: "Renderful did not return a generation ID." });
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  await saveImageJob({
    id: recordId, userId, model, prompt: cleanPrompt,
    status: "generating", providerId: String(data.id),
  });
  return Response.json({ requestId: data.id, modelId: model.model_id });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  if (!requestId) return Response.json({ error: "Missing requestId." }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Please sign in to continue." }, { status: 401 });

  const job = await get(
    "SELECT id FROM ai_generations WHERE prediction_id = ? AND user_id = ? AND LOWER(type) LIKE '%image%'",
    [String(requestId), session.user.id]
  );
  if (!job) return Response.json({ error: "This generation could not be found." }, { status: 404 });

  let data;
  try {
    data = await getGeneration(requestId);
  } catch (err) {
    if (err.code === "NO_KEY") {
      return Response.json({ error: "Generation service is not configured yet.", setupRequired: true }, { status: 503 });
    }
    console.error("generate-image Renderful status error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  const status = normalizeStatus(data.status);
  if (status === "COMPLETED") {
    const imageUrl = outputUrl(data);
    if (!imageUrl) return Response.json({ status: "PROCESSING", progress: data.progress ?? null });
    await run(
      "UPDATE ai_generations SET status = 'completed', output_url = ?, thumbnail_url = ?, provider_status = ? WHERE id = ? AND user_id = ?",
      [imageUrl, imageUrl, status, job.id, session.user.id]
    );
    return Response.json({ status, imageUrl, outputs: data.outputs || [] });
  }

  if (status === "FAILED" || status === "CANCELLED") {
    const failure = safeProviderError(data);
    await run(
      "UPDATE ai_generations SET status = 'failed', error_message = ?, provider_status = ? WHERE id = ? AND user_id = ?",
      [failure, status, job.id, session.user.id]
    );
    console.error("Renderful image generation failed:", { predictionId: requestId, modelId: data.model || null, providerError: failure });
    return Response.json({
      status,
      error: "The AI provider could not complete this image. Please try again later.",
      noCreditsCharged: true,
    });
  }

  return Response.json({ status, progress: data.progress ?? null });
}
