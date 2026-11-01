import { getRenderfulKey, maskKey } from "@/lib/renderful";

export async function GET() {
  const keyResult = await getRenderfulKey();
  return Response.json({
    success: true,
    hasKey: keyResult.hasKey,
    source: keyResult.source || "missing",
    masked: keyResult.hasKey ? maskKey(keyResult.key) : null,
  });
}
