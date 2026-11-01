import { videoModels } from "@/app/lib/capabilities";
import { getGeneration, normalizeStatus, outputUrl, submitGeneration } from "@/lib/renderful";
import { saveImageDataUrl } from "@/lib/uploads";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

const MODEL_BY_ID = Object.fromEntries(videoModels.map((m) => [m.model_id, m]));

function secondsFromDuration(duration) {
  const value = parseInt(String(duration || ""), 10);
  return Number.isFinite(value) ? value : 5;
}

function normalizeAspectRatio(value) {
  if (!value) return null;
  if (typeof value === "object" && value.label) return normalizeAspectRatio(value.label);
  const text = String(value);
  const match = text.match(/(\d+)\s*:\s*(\d+)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function buildVideoPayload({ model, prompt, imageUrl, aspectRatio, resolution, duration }) {
  const seconds = secondsFromDuration(duration);
  const base = {
    type: "image-to-video",
    model: model.model_id,
    prompt,
    image_url: imageUrl,
  };

  if (model.payload === "kling-v3") {
    const mode = resolution === "4k" ? "4k" : resolution === "1080p" ? "pro" : "std";
    return {
      type: "image-to-video",
      model: model.model_id,
      prompt,
      image: imageUrl,
      mode,
      duration: seconds,
      sound: true,
    };
  }

  if (model.payload === "wan-3.0") {
    return {
      ...base,
      resolution: String(resolution || "720p").toLowerCase(),
      duration: seconds,
      enable_audio: true,
    };
  }

  if (model.payload === "seedance-2.0" || model.payload === "seedance-2.0-mini") {
    return {
      ...base,
      aspect_ratio: normalizeAspectRatio(aspectRatio) || "16:9",
      resolution: String(resolution || "720p").toLowerCase(),
      duration: seconds,
      generate_audio: true,
    };
  }

  if (model.payload === "hailuo-03") {
    return {
      ...base,
      resolution: resolution === "2K" ? "2K" : "768p",
      duration: seconds,
    };
  }

  return base;
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

  const { prompt, modelId, aspectRatio, resolution, duration, image, imageUrl } = body || {};
  const model = MODEL_BY_ID[modelId];

  if (!model) {
    return Response.json({ error: "Unsupported model." }, { status: 400 });
  }
  if (!prompt || !String(prompt).trim()) {
    return Response.json({ error: "Write a prompt first." }, { status: 400 });
  }

  let resolvedImageUrl;
  try {
    resolvedImageUrl = await resolveImageUrl(image || imageUrl, new URL(request.url).origin);
  } catch (err) {
    return Response.json({ error: err.message || "Could not upload the image." }, { status: 400 });
  }

  if (model.requiresImage && !resolvedImageUrl) {
    return Response.json({ error: "Upload a photo first." }, { status: 400 });
  }

  const payload = buildVideoPayload({
    model,
    prompt: String(prompt).trim(),
    imageUrl: resolvedImageUrl,
    aspectRatio,
    resolution,
    duration,
  });

  let data;
  try {
    data = await submitGeneration(payload);
  } catch (err) {
    if (err.code === "NO_KEY") {
      return Response.json(
        { error: "Generation service is not configured yet.", setupRequired: true },
        { status: 503 }
      );
    }
    console.error("generate-video Renderful submit error:", err.message);
    return Response.json(
      { error: err.status && err.status < 500 ? err.message : PROVIDER_UNAVAILABLE },
      { status: err.status && err.status < 500 ? 400 : 503 }
    );
  }

  return Response.json({ requestId: data.id, modelId: model.model_id });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) {
    return Response.json({ error: "Missing requestId." }, { status: 400 });
  }

  let data;
  try {
    data = await getGeneration(requestId);
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
    return Response.json({
      status,
      videoUrl: outputUrl(data),
      outputs: data.outputs || [],
    });
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return Response.json({
      status,
      error: data.error || data.message || "The AI generation failed on the provider.",
    });
  }

  return Response.json({ status, progress: data.progress ?? null });
}
