import { getFalKey } from "@/lib/fal-key";

const FAL_BASE = "https://queue.fal.run";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

const MODEL_PAYLOADS = {
  "fal-ai/veo3.1/fast": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    image_url: null,
  }),
  "xai/grok-imagine-video/text-to-video": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
  }),
  "bytedance/seedance/v1.5/pro/text-to-video": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    duration: 5,
  }),
  "bytedance/seedance-2.0/text-to-video": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    duration: 5,
  }),
  "kling-video/v3/pro/text-to-video": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    duration: 5,
  }),
  "fal-ai/runway-gen-3": ({ prompt }) => ({
    prompt,
    image_url: null,
  }),
  "fal-ai/luma-dream-machine": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    image_url: null,
  }),
  "fal-ai/pika": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    image_url: null,
  }),
  "alibaba/happy-horse/text-to-video": ({ prompt, aspectRatio }) => ({
    prompt,
    aspect_ratio: aspectRatio,
    duration: 5,
  }),
};

export async function POST(request) {
  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json(
      { error: "Generation service is not configured yet.", setupRequired: true },
      { status: 503 }
    );
  }

  const { prompt, modelId, aspectRatio } = await request.json();

  const ratioMap = {
    "Cinematic 16:9": "16:9",
    "Instagram 9:16": "9:16",
    "Square 1:1": "1:1",
    "Portrait 4:5": "4:5",
  };

  const buildPayload = MODEL_PAYLOADS[modelId];
  if (!buildPayload) {
    return Response.json({ error: `Unsupported model: ${modelId}` }, { status: 400 });
  }

  const payload = buildPayload({ prompt, aspectRatio: ratioMap[aspectRatio] || "16:9" });

  let res;
  try {
    res = await fetch(`${FAL_BASE}/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${keyResult.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("generate-video submit network error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!res.ok) {
    const text = (await res.text()).slice(0, 400);
    console.error(`generate-video fal error ${res.status}: ${text}`);
    return Response.json({ error: PROVIDER_UNAVAILABLE, provider_status: res.status }, { status: 503 });
  }

  const data = await res.json();
  return Response.json({ requestId: data.request_id, modelId });
}

export async function GET(request) {
  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json(
      { error: "Generation service is not configured yet.", setupRequired: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const modelId = searchParams.get("modelId");

  if (!requestId || !modelId) {
    return Response.json({ error: "Missing requestId or modelId" }, { status: 400 });
  }

  let statusRes;
  try {
    statusRes = await fetch(`${FAL_BASE}/${modelId}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
  } catch (err) {
    console.error("generate-video status network error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!statusRes.ok) {
    const text = (await statusRes.text()).slice(0, 400);
    console.error(`generate-video status error ${statusRes.status}: ${text}`);
    return Response.json({ error: PROVIDER_UNAVAILABLE, provider_status: statusRes.status }, { status: 503 });
  }

  const statusData = await statusRes.json();

  if (statusData.status === "COMPLETED") {
    const resultRes = await fetch(`${FAL_BASE}/${modelId}/requests/${requestId}`, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
    const result = await resultRes.json();
    return Response.json({ status: "COMPLETED", videoUrl: result.video?.url || result.video_url, ...result });
  }

  return Response.json({ status: statusData.status });
}