import { query } from "../../../../lib/db";

const DIAGNOSTIC_COLUMNS = [
  "error", "error_message", "failure_reason", "failure_details",
  "provider_error", "provider_error_message", "error_details",
  "prediction_id", "provider_request_id", "provider_status",
];

export async function GET() {
  try {
    // Discover optional diagnostic columns so older D1 schemas keep working.
    const schema = await query("PRAGMA table_info(ai_generations)");
    const available = new Set(schema.map((column) => column.name));
    const diagnosticSelect = DIAGNOSTIC_COLUMNS
      .filter((column) => available.has(column))
      .map((column) => `g.${column}`)
      .join(", ");
    const sql = `
      SELECT g.id, g.user_id, u.name AS user_name, u.email AS user_email,
        g.type, g.provider, g.model, g.prompt, g.status, g.progress,
        g.credits_used, g.generation_time, g.output_url, g.thumbnail_url,
        g.created_at${diagnosticSelect ? `, ${diagnosticSelect}` : ""}
      FROM ai_generations g
      LEFT JOIN users u ON g.user_id = u.id
      ORDER BY g.created_at DESC
    `;
    const rows = await query(sql);
    // Older failed jobs were recorded only in the billing table, not ai_generations.
    // Include them so Admin can still see their status even when no output was saved.
    let legacyFailedVideos = [];
    try {
      legacyFailedVideos = await query(`
        SELECT b.request_id AS id, b.user_id, u.name AS user_name, u.email AS user_email,
          'AI Video' AS type, b.provider, b.model_id AS model, b.prompt,
          'failed' AS status, 0 AS credits_used, NULL AS output_url,
          NULL AS thumbnail_url, b.created_at, b.provider_id AS prediction_id
        FROM video_generation_billing b
        LEFT JOIN users u ON u.id = b.user_id
        WHERE LOWER(b.status) IN ('failed', 'cancelled')
          AND NOT EXISTS (
            SELECT 1 FROM ai_generations g WHERE g.id = 'video_' || b.request_id
          )
        ORDER BY b.created_at DESC
      `);
    } catch {
      // The billing table is created only after the first video generation.
    }
    const combinedRows = [...rows, ...legacyFailedVideos];
    const data = combinedRows.map((row) => ({
      ...row,
      tool: (() => {
        const type = String(row.type || "").toLowerCase().replace(/[ _]/g, "-");
        if (type.includes("video") || type === "text-to-video" || type === "image-to-video") return "AI Video";
        if (type.includes("image")) return "Image Lab";
        return row.type || "AI Tool";
      })(),
      output_file: row.output_url || null,
      failure_reason: row.failure_reason || row.provider_error_message ||
        row.provider_error || row.error_message || row.error_details || row.error || null,
    })).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return Response.json({ data, total: data.length });
  } catch (error) {
    console.error("[admin/generations] Could not load generation diagnostics:", error);
    return Response.json({ error: "Could not load generation history" }, { status: 500 });
  }
}
