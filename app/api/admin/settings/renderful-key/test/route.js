import { testRenderfulKey } from "@/lib/renderful";

export async function POST(request) {
  const { renderfulKey } = await request.json();

  if (!renderfulKey) {
    return Response.json({ success: false, valid: false, message: "No key provided" }, { status: 400 });
  }

  try {
    const result = await testRenderfulKey(renderfulKey.trim());
    return Response.json({
      success: result.valid,
      valid: result.valid,
      message: result.message,
      balance: result.balance,
      tier: result.tier,
    });
  } catch (err) {
    return Response.json({ success: false, valid: false, message: err.message }, { status: 500 });
  }
}
