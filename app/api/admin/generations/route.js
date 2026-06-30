import { query } from "../../../../lib/db";

export async function GET() {
  let rows = [];
  try {
    rows = await query("SELECT * FROM generations ORDER BY created_at DESC");
  } catch { rows = []; }
  return Response.json({ data: rows, total: rows.length });
}
