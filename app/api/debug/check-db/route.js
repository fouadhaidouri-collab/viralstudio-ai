import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    results.withdrawalsSchema = await query("PRAGMA table_info(withdrawals)");
  } catch (e) {
    results.error = e.message;
    results.stack = e.stack;
  }
  return NextResponse.json(results);
}
