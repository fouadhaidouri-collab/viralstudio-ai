import { query } from "../../../../lib/db";

export async function GET() {
  let settings = {}, models = [], presets = [];
  try {
    const rows = await query("SELECT key, value FROM chat_settings");
    for (const r of rows) settings[r.key] = r.value;
    models = await query("SELECT * FROM chat_models ORDER BY name ASC");
    presets = await query("SELECT * FROM presets ORDER BY name ASC");
  } catch {}
  return Response.json({ settings, models, presets });
}
