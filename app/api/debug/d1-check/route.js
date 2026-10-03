import { NextResponse } from "next/server";
import { query, getD1Config } from "@/lib/db";

// Diagnostic: reports the D1 target account/db, auth mode, whether the token
// env is configured (never the token itself) and runs a live SELECT 1 ping.
export async function GET() {
  const out = { ...getD1Config() };
  try {
    const rows = await query("SELECT 1 AS ok");
    out.ping = { ok: true, rows: rows.length };
  } catch (e) {
    out.ping = { ok: false, error: e.message };
  }
  return NextResponse.json(out);
}