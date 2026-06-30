import { query, run, get } from "../../../lib/db";

export async function GET() {
  const rows = await query("SELECT * FROM domains ORDER BY created_at DESC");
  return Response.json({ domains: rows, active: rows.find((d) => d.is_active) || null });
}

export async function POST(req) {
  const body = await req.json();
  const { action, domain, id } = body;

  if (action === "add") {
    const existing = await get("SELECT * FROM domains WHERE domain = ?", [domain]);
    if (existing) return Response.json({ domains: [], error: "Domain already exists" }, { status: 400 });
    const domId = `dom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await run(
      "INSERT INTO domains (id, domain, status, is_active, created_at) VALUES (?, ?, 'pending', 0, datetime('now'))",
      [domId, domain]
    );
    const rows = await query("SELECT * FROM domains ORDER BY created_at DESC");
    const added = rows.find((d) => d.id === domId);
    return Response.json({ domains: rows, added });
  }

  if (action === "remove") {
    await run("DELETE FROM domains WHERE id = ?", [id]);
    const rows = await query("SELECT * FROM domains ORDER BY created_at DESC");
    return Response.json({ domains: rows });
  }

  if (action === "set_active") {
    await run("UPDATE domains SET is_active = 0");
    await run("UPDATE domains SET is_active = 1 WHERE id = ?", [id]);
    const rows = await query("SELECT * FROM domains ORDER BY created_at DESC");
    return Response.json({ domains: rows });
  }

  if (action === "verify") {
    const dom = await get("SELECT * FROM domains WHERE id = ?", [id]);
    if (!dom) return Response.json({ domains: [], error: "Not found" }, { status: 404 });
    try {
      const res = await fetch(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID || ''}/domains/${dom.domain}`, {
        headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        const status = data.verified ? 'verified' : 'pending';
        await run("UPDATE domains SET status = ?, ssl_status = ?, updated_at = datetime('now') WHERE id = ?", [status, data.ssl?.status || 'pending', id]);
      } else {
        await run("UPDATE domains SET status = 'failed', updated_at = datetime('now') WHERE id = ?", [id]);
      }
    } catch {
      await run("UPDATE domains SET status = 'failed', updated_at = datetime('now') WHERE id = ?", [id]);
    }
    const rows = await query("SELECT * FROM domains ORDER BY created_at DESC");
    const updated = rows.find((d) => d.id === id);
    return Response.json({ domains: rows, verified: updated?.status === 'verified', message: updated?.status === 'verified' ? 'Domain verified!' : 'Verification failed. Check DNS records.' });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
