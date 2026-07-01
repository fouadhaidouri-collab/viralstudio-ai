import { run } from "../../lib/db";

export async function GET() {
  try {
    await run("ALTER TABLE affiliate_accounts ADD COLUMN created_at TEXT;");
    return Response.json({ ok: true, message: "Column added" });
  } catch (err) {
    return Response.json({ ok: false, error: err.message });
  }
}
