import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";

const TRACKED_PATH = "/admin/settings";

export async function GET() {
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

    const [summary] = await query(
      `SELECT
         COUNT(*) AS total,
         COUNT(DISTINCT user_id) AS unique_visitors,
         SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last7
       FROM page_visits
       WHERE path = ?`,
      [TRACKED_PATH]
    );

    const visits = await query(
      `SELECT id, user_id, email, ip, user_agent, referrer, created_at
       FROM page_visits
       WHERE path = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [TRACKED_PATH]
    );

    const daily = await query(
      `SELECT date(created_at) AS day, COUNT(*) AS count
       FROM page_visits
       WHERE path = ? AND created_at >= datetime('now', '-6 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`,
      [TRACKED_PATH]
    );

    return Response.json({
      path: TRACKED_PATH,
      summary: {
        total: Number(summary?.total || 0),
        unique_visitors: Number(summary?.unique_visitors || 0),
        today: Number(summary?.today || 0),
        last7: Number(summary?.last7 || 0),
      },
      visits,
      daily,
    });
  } catch (err) {
    console.error("settings visits error:", err);
    return Response.json({ error: "Could not load settings visits" }, { status: 500 });
  }
}
