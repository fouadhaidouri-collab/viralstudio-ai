import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";

let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

function getCountryName(code) {
  if (!code) return "Unknown";
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
}

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
         COUNT(DISTINCT ip) AS unique_ips,
         COUNT(DISTINCT NULLIF(country_code, '')) AS countries,
         SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last7
       FROM page_visits`
    );

    const visits = await query(
      `SELECT id, ip, country_code, device, path, referrer, user_agent, created_at
       FROM page_visits
       ORDER BY created_at DESC
       LIMIT 50`
    );

    const daily = await query(
      `SELECT date(created_at) AS day, COUNT(*) AS count
       FROM page_visits
       WHERE created_at >= datetime('now', '-6 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    );

    return Response.json({
      summary: {
        total: Number(summary?.total || 0),
        unique_ips: Number(summary?.unique_ips || 0),
        countries: Number(summary?.countries || 0),
        today: Number(summary?.today || 0),
        last7: Number(summary?.last7 || 0),
      },
      visits: visits.map((visit) => ({
        ...visit,
        country_name: getCountryName(visit.country_code),
      })),
      daily,
    });
  } catch (err) {
    console.error("visitors error:", err);
    return Response.json({ error: "Could not load visitors" }, { status: 500 });
  }
}
