import { query } from "../../../../lib/db";

export async function GET() {
  let frameworks = [];
  try { frameworks = await query("SELECT * FROM hook_frameworks ORDER BY name ASC"); } catch {}
  return Response.json({ data: frameworks, total: frameworks.length });
}
