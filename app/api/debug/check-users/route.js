import { query } from "../../../../lib/db";

export async function GET() {
  const users = await query("SELECT id, name, email, password, role FROM users WHERE email = 'fouadhaidouri@gmail.com'");
  return Response.json(users);
}
