import { saveImageDataUrl } from "@/lib/uploads";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid upload request." }, { status: 400 });
  }

  if (!body?.dataUrl) {
    return Response.json({ error: "Missing image data." }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const url = await saveImageDataUrl(body.dataUrl, origin);
    return Response.json({ success: true, url });
  } catch (err) {
    return Response.json({ error: err.message || "Could not store image." }, { status: 400 });
  }
}
