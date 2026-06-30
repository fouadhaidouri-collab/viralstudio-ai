import { query } from "../../../../lib/db";

export async function GET() {
  let rows = [];
  try {
    rows = await query("SELECT * FROM models ORDER BY created_at DESC");
  } catch { rows = []; }
  return Response.json({ data: rows, total: rows.length });
}
