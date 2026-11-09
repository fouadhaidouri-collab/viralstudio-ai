import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getRenderfulKey, maskKey, saveRenderfulKey, testRenderfulKey } from "../../../../lib/renderful.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await findUser(session.user.email);
  if (!user) return { response: Response.json({ error: "User not found" }, { status: 404 }) };
  if (user.role !== "admin") return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if (access.response) return access.response;
    const current = await getRenderfulKey();
    return Response.json({
      configured: Boolean(current.hasKey),
      masked: current.hasKey ? maskKey(current.key) : "",
      source: current.source || "",
    });
  } catch (error) {
    console.error("Renderful key status error:", error);
    return Response.json({ error: "Could not load Renderful key status" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const access = await requireAdmin();
    if (access.response) return access.response;

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const key = String(body.key || "").trim();

    if (action === "test_saved") {
      const current = await getRenderfulKey();
      if (!current.hasKey) return Response.json({ valid: false, message: "No active Renderful API key is configured." }, { status: 422 });
      const result = await testRenderfulKey(current.key);
      return Response.json({ ...result, source: current.source }, { status: result.valid ? 200 : 422 });
    }
    if (action === "remove") {
      const { removeRenderfulKey } = await import("../../../../lib/renderful.js");
      await removeRenderfulKey();
      return Response.json({ removed: true });
    }

    if (!key || key.length > 500) {
      return Response.json({ error: "Enter a valid Renderful API key." }, { status: 400 });
    }

    if (action === "test") {
      const result = await testRenderfulKey(key);
      return Response.json(result, { status: result.valid ? 200 : 422 });
    }

    if (action === "save") {
      await saveRenderfulKey(key);
      return Response.json({ saved: true, masked: maskKey(key), source: "database" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Renderful key action error:", error);
    return Response.json({ error: "Could not update Renderful API key. Check the database connection." }, { status: 500 });
  }
}
