import { getRenderfulKey, maskKey } from "@/lib/renderful";
import { getAdminAccess } from "@/lib/adminAuth";

export async function GET() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return Response.json({ success: false, message: access.message }, { status: access.status });
  }

  try {
    const keyResult = await getRenderfulKey();
    return Response.json({
      success: true,
      hasKey: keyResult.hasKey,
      source: keyResult.source || "missing",
      masked: keyResult.hasKey ? maskKey(keyResult.key) : null,
    });
  } catch (err) {
    console.error("Renderful key status failed:", err.message);
    return Response.json({ success: false, message: "Could not read API key status." }, { status: 500 });
  }
}
