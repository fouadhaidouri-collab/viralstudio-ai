import { maskKey, saveRenderfulKey, testRenderfulKey } from "@/lib/renderful";

export async function POST(request) {
  const { renderfulKey } = await request.json();

  if (!renderfulKey) {
    return Response.json({ success: false, message: "No key provided" }, { status: 400 });
  }

  try {
    const result = await testRenderfulKey(renderfulKey.trim());
    if (!result.valid) {
      return Response.json({ success: false, message: result.message }, { status: 400 });
    }

    await saveRenderfulKey(renderfulKey.trim());
    return Response.json({ success: true, masked: maskKey(renderfulKey.trim()) });
  } catch (err) {
    console.error("Could not persist Renderful API key:", err.message);
    return Response.json({ success: false, message: "The key was validated but could not be saved to persistent storage." }, { status: 500 });
  }
}
