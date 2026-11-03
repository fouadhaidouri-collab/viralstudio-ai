import { getVideoModel } from "@/app/lib/videoCatalog";
import {
  getGeneration,
  normalizeStatus,
  outputUrl,
  submitGeneration,
} from "@/lib/renderful";
import { saveImageDataUrl } from "@/lib/uploads";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

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
      error:
        data.error ||
        data.message ||
        "The AI generation failed on the provider.",
    });
  }

  return Response.json({ status, progress: data.progress ?? null });
}
