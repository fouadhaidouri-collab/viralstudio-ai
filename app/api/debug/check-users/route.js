import { NextResponse } from "next/server";
import { query, get, run } from "@/lib/db";
import { createUser } from "@/app/lib/userStore";

export async function GET() {
  const results = {};
  const users = await query("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC");
  results.users = users;
  const admin = users.find(u => u.email === "fouadhaidouri@gmail.com");
  if (!admin) {
    try {
      const user = await createUser("Admin", "fouadhaidouri@gmail.com", "Admin123!");
      results.created = user;
    } catch (e) {
      results.createError = e.message;
    }
  }
  return NextResponse.json(results);
}
