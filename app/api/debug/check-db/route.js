import { NextResponse } from "next/server";
import { get, query, run } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    const tables = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    results.tables = tables;
  } catch (e) {
    results.tablesError = e.message;
  }
  try {
    const aff = await get("SELECT * FROM affiliate_accounts WHERE referral_code = ?", ["FOUADHAIDOURI20"]);
    results.affiliate = aff;
  } catch (e) {
    results.affiliateError = e.message;
  }
  return NextResponse.json(results);
}
