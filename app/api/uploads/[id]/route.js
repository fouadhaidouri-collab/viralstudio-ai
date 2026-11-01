import { getUpload } from "@/lib/uploads";

export async function GET(request, { params }) {
  const { id } = await params;

  if (!/^[a-f0-9-]{36}$/i.test(id || "")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const row = await getUpload(id);
    if (!row?.data) {
      return new Response("Not found", { status: 404 });
    }

    const bytes = Buffer.from(row.data, "base64");
    return new Response(bytes, {
      headers: {
        "Content-Type": row.mime || "image/jpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
