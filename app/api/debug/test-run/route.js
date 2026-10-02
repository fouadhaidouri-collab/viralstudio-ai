import { NextResponse } from "next/server";
import { get, run, query } from "@/lib/db";

export async function GET() {
  const results = {};
  try {
    const r = await run("SELECT 1 as test");
    results.runSelect = r;
  } catch (e) {
    results.runSelectError = e.message;
  }
  try {
    const r = await run("CREATE TABLE IF NOT EXISTS _test (id TEXT PRIMARY KEY)");
    results.runCreate = r;
  } catch (e) {
    results.runCreateError = e.message;
  }
  try {
    const r = await run("DELETE FROM _test WHERE id = ?", ["x"]);
    results.runDelete = r;
  } catch (e) {
    results.runDeleteError = e.message;
  }
  try {
    const r = await run("INSERT INTO _test (id) VALUES (?)", ["test123"]);
    results.runInsert = r;
  } catch (e) {
    results.runInsertError = e.message;
  }
  try {
    const r = await query("SELECT * FROM users LIMIT 1");
    results.query = r;
  } catch (e) {
    results.queryError = e.message;
  }
  try {
    await run("DROP TABLE _test");
    results.dropOk = true;
  } catch (e) {
    results.dropError = e.message;
  }
  return NextResponse.json(results);
}
