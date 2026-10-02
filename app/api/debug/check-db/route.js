import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    results.tables = tables;
  } catch (e) {
    results.error = e.message;
  }
  return NextResponse.json(results);
}
