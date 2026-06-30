import { query } from "../../../../lib/db";

export async function GET() {
  let rows = [];
  try {
    rows = await query("SELECT * FROM plans ORDER BY monthly_price ASC");
  } catch { rows = []; }
  return Response.json({ data: rows, total: rows.length });
}
