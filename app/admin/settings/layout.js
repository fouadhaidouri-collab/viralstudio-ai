import { cookies, headers } from "next/headers";
import { verifyToken } from "../../lib/session";
import { findUser } from "../../lib/userStore";
import { get, run } from "../../../lib/db";

export const dynamic = "force-dynamic";

const TRACKED_PATH = "/admin/settings";

async function trackSettingsVisit() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("next-auth.session-token")?.value;
    if (!token) return;

    const session = verifyToken(token);
    if (!session?.email) return;

    const user = await findUser(session.email);
    if (!user || user.role !== "admin") return;

    const recent = await get(
      `SELECT id FROM page_visits
       WHERE user_id = ? AND path = ? AND created_at >= datetime('now', '-20 seconds')
       LIMIT 1`,
      [user.id, TRACKED_PATH]
    );
    if (recent) return;

    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for") || "";
    const ip = (forwarded.split(",")[0].trim() || headerStore.get("x-real-ip") || "").slice(0, 64);
    const userAgent = (headerStore.get("user-agent") || "").slice(0, 500);
    const referrer = (headerStore.get("referer") || "").slice(0, 300);

    await run(
      `INSERT INTO page_visits (id, user_id, email, path, ip, user_agent, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), user.id, user.email, TRACKED_PATH, ip, userAgent, referrer]
    );
  } catch (err) {
    // Tracking must never block the Settings page.
    console.error("settings visit track error:", err);
  }
}

export default async function SettingsLayout({ children }) {
  await trackSettingsVisit();
  return children;
}
