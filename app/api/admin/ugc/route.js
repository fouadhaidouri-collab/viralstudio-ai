import { query } from "../../../../lib/db";

export async function GET() {
  let avatars = [], voices = [], templates = [], presets = [];
  try {
    avatars = await query("SELECT * FROM ugc_avatars ORDER BY name ASC");
    voices = await query("SELECT * FROM ugc_voices ORDER BY name ASC");
    templates = await query("SELECT * FROM ugc_templates ORDER BY name ASC");
    presets = await query("SELECT * FROM export_presets ORDER BY name ASC");
  } catch {}
  return Response.json({ avatars, voices, templates, presets });
}
