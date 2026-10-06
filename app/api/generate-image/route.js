import { getFalKey } from "@/lib/fal-key";

const FAL_BASE = "https://queue.fal.run";

const PROVIDER_UNAVAILABLE =
  "AI generation service is temporarily unavailable. Please try again later.";

export async function POST(request) {
  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json(
      { error: "Generation service is not configured yet.", setupRequired: true },
      { status: 503 }
    );
  }

  const { prompt, modelId, aspectRatio, resolution } = await request.json();

  const aspectMap = {
    "Square 1:1": "1:1",
    "Portrait 4:5": "4:5",
    "Landscape 16:9": "16:9",
    "Portrait 9:16": "9:16",
  };

  const resMap = { "4k": 2160, "1080p": 1080, "1080": 1080, "720p": 720, "720": 720 };
  const resNum = resMap[resolution] || 720;
  const ar = aspectMap[aspectRatio] || "1:1";
  const [aw, ah] = ar.split(":").map(Number);
  const isLandscape = aw > ah;
  const w = isLandscape ? Math.round(resNum * (aw / ah)) : resNum;
  const h = isLandscape ? resNum : Math.round(resNum * (ah / aw));

  const payload = {
    prompt,
    aspect_ratio: ar,
    image_size: { width: w, height: h },
  };

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
    console.error("generate-image submit network error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!res.ok) {
    const text = (await res.text()).slice(0, 400);
    console.error(`generate-image fal error ${res.status}: ${text}`);
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
    console.error("generate-image status network error:", err.message);
    return Response.json({ error: PROVIDER_UNAVAILABLE }, { status: 503 });
  }

  if (!statusRes.ok) {
    const text = (await statusRes.text()).slice(0, 400);
    console.error(`generate-image status error ${statusRes.status}: ${text}`);
    return Response.json({ error: PROVIDER_UNAVAILABLE, provider_status: statusRes.status }, { status: 503 });
  }

  const statusData = await statusRes.json();

  if (statusData.status === "COMPLETED") {
    const resultRes = await fetch(`${FAL_BASE}/${modelId}/requests/${requestId}`, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
    const result = await resultRes.json();
    return Response.json({ status: "COMPLETED", imageUrl: result.image?.url || result.image_url || result.images?.[0]?.url, ...result });
  }

  return Response.json({ status: statusData.status });
}