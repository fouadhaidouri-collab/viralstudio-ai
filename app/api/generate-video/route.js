import { getVideoModel, estimateCredits } from "@/app/lib/videoCatalog";
import { auth } from "@/app/lib/auth";
import { get, run, batch } from "@/lib/db";
import { getCreditSettings, getUserCredits } from "@/lib/pricing";
import {
  getGeneration,
  normalizeStatus,
  outputUrl,
  submitGeneration,
} from "@/lib/renderful";
import { saveImageDataUrl } from "@/lib/uploads";

const PROVIDER_UNAVAILABLE =
  "The video provider is temporarily unavailable. Your credits were not charged. Please try again later.";

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

function getCustomerProviderMessage(value) {
  const message = String(value?.message ?? value?.error?.message ?? value?.error ?? value ?? "").toLowerCase();

  if (/insufficient\s+(balance|funds|credits)|low\s+balance|balance\s+(too\s+low|insufficient)|not enough\s+(balance|funds|credits)|quota\s+exceeded/.test(message)) {
    return "The video provider cannot process this request right now because its service balance or quota is unavailable. Your credits were not charged. Please try again later.";
  }
  if (/rate.?limit|too many requests|throttl/.test(message)) {
    return "The video provider is receiving too many requests right now. Your credits were not charged. Please wait a moment and try again.";
  }
  if (/timeout|timed out|temporar|unavailable|connection|network/.test(message)) {
    return "The video provider is temporarily unavailable. Your credits were not charged. Please try again in a few minutes.";
  }
  if (/invalid|unsupported|required|parameter|payload/.test(message)) {
    return "The video provider rejected this request because some generation settings may not be supported by this model. Your credits were not charged. Please review the settings or try another model.";
  }
  return "The video provider could not complete this generation. This may be a temporary provider-side issue. Your credits were not charged. Please try again later.";
}

function secondsFromDuration(duration) {
  const value = parseInt(String(duration || ""), 10);
  return Number.isFinite(value) ? value : 5;
}

function normalizeAspectRatio(value) {
  if (!value) return null;
  const text = String(value?.label ?? value).trim();
  if (text.toLowerCase() === "adaptive") return "adaptive";
  const match = text.match(/(\d+)\s*:\s*(\d+)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function pickMappedValue(map, value) {
  if (!map || !value) return null;
  const exact = map[value];
  if (exact !== undefined) return exact;
  const lower = String(value).toLowerCase();
  if (map[lower] !== undefined) return map[lower];
  const key = Object.keys(map).find((k) => k.toLowerCase() === lower);
  return key ? map[key] : null;
}

function buildVideoPayload({
  model,
  prompt,
  imageUrl,
  lastFrameUrl,
  aspectRatio,
  resolution,
  duration,
  audio,
}) {
  const config = model.modeConfig || {};
  const seconds = secondsFromDuration(duration);
  const payload = {
    type: config.type || (model.mode === "text" ? "text-to-video" : "image-to-video"),
    model: model.model_id,
  };

  const cleanPrompt = String(prompt || "").trim();
  if (cleanPrompt) payload.prompt = cleanPrompt;

  if (model.mode === "image" && imageUrl) {
    payload[model.imageField || "image_url"] = imageUrl;
  }

  if (
    model.mode === "image" &&
    lastFrameUrl &&
    model.lastFrameField
  ) {
    payload[model.lastFrameField] = lastFrameUrl;
  }

  if (model.nativeAspectRatio) {
    const normalized = normalizeAspectRatio(aspectRatio);
    if (normalized) payload.aspect_ratio = normalized;
  }

  if (model.sizeMap) {
    const key = String(aspectRatio?.label ?? aspectRatio ?? "");
    payload.size =
      pickMappedValue(model.sizeMap, key) ||
      model.sizeMap.default ||
      "1280*720";
  }

  if (model.resolutionKey && resolution) {
    const mapped = model.resolutionMap
      ? pickMappedValue(model.resolutionMap, resolution)
      : null;
    payload[model.resolutionKey] =
      mapped || String(resolution).toLowerCase();
  }

  if (seconds) payload.duration = seconds;

  if (model.audioField && model.audioMode !== "silent") {
    payload[model.audioField] = audio !== false;
  }

  return payload;
}

async function resolveImageUrl(image, origin) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  if (String(image).startsWith("data:image/")) {
    return saveImageDataUrl(image, origin);
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Please sign in to generate a video." }, { status: 401 });

  const {
    mode,
    prompt,
    modelId,
    aspectRatio,
    resolution,
    duration,
    image,
    imageUrl,
    lastFrame,
    lastFrameUrl,
    audio,
  } = body || {};

  const resolvedMode = mode === "text" ? "text" : "image";
  const model =
    getVideoModel(resolvedMode, modelId) ||
    getVideoModel(resolvedMode === "text" ? "image" : "text", modelId);

  if (!model) {
    return Response.json({ error: "Unsupported model." }, { status: 400 });
  }

  if (model.requiresPrompt && !String(prompt || "").trim()) {
    return Response.json({ error: "Write a prompt first." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  let resolvedImageUrl = null;
  let resolvedLastFrameUrl = null;

  try {
    resolvedImageUrl = await resolveImageUrl(image || imageUrl, origin);
    resolvedLastFrameUrl = await resolveImageUrl(
      lastFrame || lastFrameUrl,
      origin
    );
  } catch (err) {
    return Response.json(
      { error: err.message || "Could not upload the image." },
      { status: 400 }
    );
  }

  if (model.requiresImage && !resolvedImageUrl) {
    return Response.json({ error: "Upload a photo first." }, { status: 400 });
  }

  if (model.requiresLastFrame && !resolvedLastFrameUrl) {
    return Response.json(
      { error: "Upload an end frame first." },
      { status: 400 }
    );
  }

  const settings = await getCreditSettings();
  const chargeAmount = estimateCredits(model, settings, { duration, resolution, audio: audio !== false });
  const userId = session.user.id;
  const requestId = crypto.randomUUID();
  await run(`CREATE TABLE IF NOT EXISTS video_generation_billing (
    request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', model_id TEXT, provider_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN provider_id TEXT"); } catch {}
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN prompt TEXT"); } catch {}
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN provider TEXT"); } catch {}
  await run(`CREATE TABLE IF NOT EXISTS video_credit_holds (
    request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'held', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  // Reserve credits atomically before calling the provider. Active holds count
  // against available balance, but do not reduce the customer's displayed balance.
  const available = await getUserCredits(userId);
  const reserve = await run(`INSERT INTO video_credit_holds (request_id, user_id, amount, status)
    SELECT ?, ?, ?, 'held'
    WHERE EXISTS (
      SELECT 1 FROM credits c WHERE c.user_id = ?
      AND c.current_balance - COALESCE((
        SELECT SUM(h.amount) FROM video_credit_holds h
        WHERE h.user_id = c.user_id AND h.status IN ('held','charging')
      ), 0) >= ?
    )`, [requestId, userId, chargeAmount, userId, chargeAmount]);
  const hold = await get("SELECT request_id FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'held'", [requestId, userId]);
  if (!hold) {
    return Response.json({ error: "You do not have enough available credits for this video. Please add credits and try again.", balance: available.balance_credits || 0, required: chargeAmount }, { status: 402 });
  }
  try {
    await run("INSERT INTO video_generation_billing (request_id, user_id, amount, status, model_id, prompt, provider) VALUES (?, ?, ?, 'pending', ?, ?, ?)", [requestId, userId, chargeAmount, model.model_id, String(prompt || ""), model.provider || "Renderful"]);
  } catch (err) {
    await run("UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status = 'held'", [requestId, userId]).catch(() => {});
    console.error("Could not create AI Video billing intent:", err.message);
    return Response.json({ error: "We could not safely start this generation. No credits were charged.", noCreditsCharged: true }, { status: 503 });
  }
  const payload = buildVideoPayload({
    model,
    prompt,
    imageUrl: resolvedImageUrl,
    lastFrameUrl: resolvedLastFrameUrl,
    aspectRatio,
    resolution,
    duration,
    audio,
  });
  // Renderful calls this endpoint when the provider finishes, even if the
  // customer has already left the AI Video page.
  payload.webhook_url = `${origin}/api/webhooks/renderful`;

  let data;
  try {
    data = await submitGeneration(payload);
  } catch (err) {
    await batch([
      { sql: "UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status = 'held'", params: [requestId, userId] },
      { sql: "UPDATE video_generation_billing SET status = 'failed' WHERE request_id = ? AND user_id = ? AND status = 'pending'", params: [requestId, userId] }
    ]).catch((releaseError) => console.error("Video credit hold release failed:", releaseError.message));
    await saveFailedVideoGeneration({
      requestId, userId, provider: model.provider || "Renderful",
      model: model.model_id, prompt, status: "SUBMISSION_FAILED", error: err.message,
    }).catch((saveError) => console.error("Could not save failed video generation:", saveError.message));
    if (err.code === "NO_KEY") {
      return Response.json({ error: "Generation service is not configured yet. No credits were charged.", setupRequired: true }, { status: 503 });
    }
    console.error("generate-video Renderful submit error:", err.message);
    return Response.json(
      { error: getCustomerProviderMessage(err.message), noCreditsCharged: true },
      { status: err.status && err.status < 500 ? 400 : 503 }
    );
  }

  if (!data?.id) {
    await batch([
      { sql: "UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status = 'held'", params: [requestId, userId] },
      { sql: "UPDATE video_generation_billing SET status = 'failed' WHERE request_id = ? AND user_id = ? AND status = 'pending'", params: [requestId, userId] }
    ]);
    await saveFailedVideoGeneration({
      requestId, userId, provider: model.provider || "Renderful",
      model: model.model_id, prompt, status: "INVALID_PROVIDER_RESPONSE",
      error: "Renderful accepted the request but did not return a generation ID.",
    }).catch((saveError) => console.error("Could not save failed video generation:", saveError.message));
    return Response.json({ error: PROVIDER_UNAVAILABLE, noCreditsCharged: true }, { status: 503 });
  }
  try {
    await run("UPDATE video_generation_billing SET provider_id = ? WHERE request_id = ? AND user_id = ?", [String(data.id), requestId, userId]);
  } catch (err) {
    console.error("Video provider reference could not be saved:", err.message);
    return Response.json({ error: "Your request was accepted but could not be tracked safely. Please contact support and do not submit it again.", requestId, noCreditsCharged: true }, { status: 503 });
  }
  return Response.json({ requestId, modelId: model.model_id });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) return Response.json({ error: "Missing requestId." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Please sign in to continue." }, { status: 401 });
  await run(`CREATE TABLE IF NOT EXISTS video_generation_billing (
    request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', model_id TEXT, provider_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN provider_id TEXT"); } catch {}
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN prompt TEXT"); } catch {}
  try { await run("ALTER TABLE video_generation_billing ADD COLUMN provider TEXT"); } catch {}
  await run(`CREATE TABLE IF NOT EXISTS video_credit_holds (
    request_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'held', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const billing = await get("SELECT * FROM video_generation_billing WHERE request_id = ? AND user_id = ?", [String(requestId), session.user.id]);
  if (!billing) return Response.json({ error: "This generation could not be found." }, { status: 404 });
  if (!billing.provider_id) return Response.json({ status: "PROCESSING", progress: null });
  let data;
  try {
    data = await getGeneration(billing.provider_id);
  } catch (err) {
    if (err.code === "NO_KEY") {
      return Response.json(
        { error: "Generation service is not configured yet.", setupRequired: true },
        { status: 503 }
      );
    }
    console.error("generate-video Renderful status error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  const status = normalizeStatus(data.status);
  if (status === "COMPLETED") {
    const videoUrl = outputUrl(data);
    if (!videoUrl) return Response.json({ status: "PROCESSING", progress: data.progress ?? null });
    if (billing.status === "pending") {
      const creditHold = await get(
        "SELECT status FROM video_credit_holds WHERE request_id = ? AND user_id = ?",
        [String(requestId), session.user.id]
      );

      // A pending billing row without a live credit hold cannot be charged.
      // Mark it completed-unpaid rather than showing a false payment error forever.
      if (!creditHold || !["held", "charging"].includes(creditHold.status)) {
        await run(
          "UPDATE video_generation_billing SET status = 'completed_unpaid' WHERE request_id = ? AND user_id = ? AND status = 'pending'",
          [String(requestId), session.user.id]
        );
      } else try {
        // D1 batch is transactional. Only a live hold can be settled; concurrent polls are no-ops.
        await batch([
          { sql: "UPDATE video_credit_holds SET status = 'charging' WHERE request_id = ? AND user_id = ? AND status = 'held'", params: [String(requestId), session.user.id] },
          { sql: "UPDATE credits SET current_balance = current_balance - ?, total_used = total_used + ?, updated_at = datetime('now') WHERE user_id = ? AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging')", params: [billing.amount, billing.amount, session.user.id, String(requestId), session.user.id] },
          { sql: "INSERT INTO credit_ledger (id, user_id, transaction_id, credits_added, reason) SELECT ?, ?, ?, ?, 'AI Video generation' WHERE EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging') AND NOT EXISTS (SELECT 1 FROM credit_ledger WHERE transaction_id = ?)", params: [`video_${requestId}`, session.user.id, String(requestId), -billing.amount, String(requestId), session.user.id, String(requestId)] },
          { sql: "UPDATE video_generation_billing SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM video_credit_holds WHERE request_id = ? AND user_id = ? AND status = 'charging')", params: [String(requestId), session.user.id, String(requestId), session.user.id] },
          { sql: "UPDATE video_credit_holds SET status = 'charged' WHERE request_id = ? AND user_id = ? AND status = 'charging'", params: [String(requestId), session.user.id] }
        ]);
      } catch (err) {
        console.error("AI Video credit settlement failed:", err.message);
        return Response.json({ status, videoUrl, outputs: data.outputs || [] });
      }
    }
    const finalBilling = await get("SELECT status, amount, model_id, prompt, provider FROM video_generation_billing WHERE request_id = ? AND user_id = ?", [String(requestId), session.user.id]);
    if (["charged", "completed_unpaid"].includes(finalBilling?.status)) {
      await run(
        "INSERT OR IGNORE INTO ai_generations (id, user_id, type, provider, model, prompt, status, credits_used, output_url, thumbnail_url, created_at) VALUES (?, ?, 'AI Video', ?, ?, ?, 'completed', ?, ?, ?, datetime('now'))",
        [`video_${requestId}`, session.user.id, finalBilling.provider || "Renderful", finalBilling.model_id, finalBilling.prompt || "", finalBilling.status === "charged" ? (finalBilling.amount || 0) : 0, videoUrl, videoUrl]
      );
    }
    const balance = await getUserCredits(session.user.id);
    return Response.json({ status, videoUrl, outputs: data.outputs || [], balance: balance.balance_credits || 0,
      });
  }

  if (status === "FAILED" || status === "CANCELLED") {
    try {
      await batch([
        { sql: "UPDATE video_credit_holds SET status = 'released' WHERE request_id = ? AND user_id = ? AND status IN ('held','charging')", params: [String(requestId), session.user.id] },
        { sql: "UPDATE video_generation_billing SET status = 'failed' WHERE request_id = ? AND user_id = ? AND status = 'pending'", params: [String(requestId), session.user.id] }
      ]);
    } catch (err) {
      console.error("Failed to release AI Video credit hold:", err.message);
      return Response.json({ status: "PROCESSING", error: "We are safely checking the generation status. No new request is needed." });
    }

    // Renderful returns the actionable failure reason on the generation record.
    // Keep it bounded and strip credential-like values before returning it to the owner.
    const rawProviderError =
      data.error?.message ||
      data.error ||
      data.failure_reason ||
      data.message ||
      data.error_message ||
      null;
    const providerError = rawProviderError
      ? String(rawProviderError)
          .replace(/Bearer\s+\\S+/gi, "Bearer [redacted]")
          .replace(/(api[_-]?key|token|secret)\s*[:=]\s*\\S+/gi, "$1=[redacted]")
          .slice(0, 500)
      : null;

    await saveFailedVideoGeneration({
      requestId: billing.request_id, userId: session.user.id,
      provider: billing.provider || "Renderful", model: billing.model_id,
      prompt: billing.prompt, providerId: billing.provider_id,
      status, error: providerError || data,
    }).catch((saveError) => console.error("Could not save failed video generation:", saveError.message));

    console.error("Renderful video generation failed:", {
      providerId: billing.provider_id,
      modelId: billing.model_id,
      providerError,
    });

    return Response.json({
      status,
      error: getCustomerProviderMessage(providerError),
      failureCategory: /insufficient\s+(balance|funds|credits)|low\s+balance|quota\s+exceeded/i.test(String(providerError || ""))
        ? "provider_balance"
        : "provider_error",
      noCreditsCharged: true,
    });
  }

  return Response.json({ status, progress: data.progress ?? null });
}
