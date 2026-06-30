import { query } from "../../../../lib/db";

export async function GET() {
  let jobs = [];
  try { jobs = await query("SELECT * FROM clipping_jobs ORDER BY created_at DESC"); } catch {}
  return Response.json({ data: jobs, total: jobs.length });
}
