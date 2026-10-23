import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { get, run } from "../../../../lib/db";

export const runtime = "nodejs";

const TRACKED_PATHS = new Set(["/admin/settings"]);

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path : "/admin/settings";
    if (!TRACKED_PATHS.has(path)) {
      return Response.json({ error: "Path is not tracked" }, { status: 400 });
    }

    // React strict mode / quick reloads can fire this twice. Count one visit
    // per user per short window, then let later visits through.
    const recent = await get(
      `SELECT id FROM page_visits
       WHERE user_id = ? AND path = ? AND created_at >= datetime('now', '-20 seconds')
       LIMIT 1`,
      [user.id, path]
    );
    if (recent) return Response.json({ ok: true, deduped: true });

    const ip = clientIp(request).slice(0, 64);
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);
    const referrer = (body.referrer || request.headers.get("referer") || "").slice(0, 300);
    const id = crypto.randomUUID();

    await run(
      `INSERT INTO page_visits (id, user_id, email, path, ip, user_agent, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, user.email, path, ip, userAgent, referrer]
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("track visit error:", err);
    return Response.json({ error: "Could not track visit" }, { status: 500 });
  }
}
