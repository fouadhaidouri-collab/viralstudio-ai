import { query } from "../../../../lib/db";

export async function GET() {
  const users = await query("SELECT id, name, email, password, role FROM users ORDER BY created_at DESC");
  const results = users.map(u => ({
    ...u,
    password: u.password ? u.password.slice(0, 16) + "..." : null,
  }));
  return Response.json(results);
}
