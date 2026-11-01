import { imageAspectRatios, imageModels } from "@/app/lib/capabilities";
import { getGeneration, normalizeStatus, outputUrl, submitGeneration } from "@/lib/renderful";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

const MODEL_BY_ID = Object.fromEntries(imageModels.map((m) => [m.model_id, m]));
const ASPECT_BY_LABEL = Object.fromEntries(
  imageAspectRatios.map((ar) => [ar.label, ar.api || ar.label])
);

function normalizeAspectRatio(value) {
  if (!value) return null;
  if (ASPECT_BY_LABEL[value]) return ASPECT_BY_LABEL[value];
  const text = String(value);
  const match = text.match(/(\d+)\s*:\s*(\d+)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function buildImagePayload({ model, prompt, aspectRatio, resolution }) {
  const payload = {
    type: "text-to-image",
    model: model.model_id,
    prompt,
  };

  const ratio = normalizeAspectRatio(aspectRatio);
  if (ratio) payload.aspect_ratio = ratio;

  if (resolution) payload.resolution = String(resolution).toLowerCase();

  return payload;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { prompt, modelId, aspectRatio, resolution } = body || {};
  const model = MODEL_BY_ID[modelId];

  if (!model) {
    return Response.json({ error: "Unsupported model." }, { status: 400 });
  }
  if (!prompt || !String(prompt).trim()) {
    return Response.json({ error: "Write a prompt first." }, { status: 400 });
  }

  const payload = buildImagePayload({
    model,
    prompt: String(prompt).trim(),
    aspectRatio,
    resolution,
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
    console.error("generate-image Renderful submit error:", err.message);
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
    console.error("generate-image Renderful status error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  const status = normalizeStatus(data.status);
  if (status === "COMPLETED") {
    return Response.json({
      status,
      imageUrl: outputUrl(data),
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
