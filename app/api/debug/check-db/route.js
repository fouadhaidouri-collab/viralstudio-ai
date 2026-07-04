import { NextResponse } from "next/server";
import { run, query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    await run("ALTER TABLE withdrawals ADD COLUMN affiliate_id TEXT;");
    results.addColumn = "ok";
  } catch (e) {
    results.addColumn = e.message;
  }
  try {
    await run("UPDATE withdrawals SET affiliate_id = affiliate_user_id WHERE affiliate_id IS NULL;");
    results.backfill = "ok";
  } catch (e) {
    results.backfill = e.message;
  }
  results.schema = await query("PRAGMA table_info(withdrawals)");
  return NextResponse.json(results);
}
