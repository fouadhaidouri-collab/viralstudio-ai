import { query } from "../../../../lib/db";

export async function GET() {
  let rows = [];
  try {
    rows = await query("SELECT * FROM tools ORDER BY display_order ASC");
  } catch { rows = []; }
  return Response.json({ data: rows, total: rows.length });
}
