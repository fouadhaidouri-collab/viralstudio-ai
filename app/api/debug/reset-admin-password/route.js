import crypto from "crypto";
import { run } from "../../../../lib/db";
import { findUser } from "../../../lib/userStore";

export async function GET() {
  const email = "fouadhaidouri@gmail.com";
  const newPassword = "Fouad2002Hiba28";
  const hash = crypto.createHash("sha256").update(newPassword).digest("hex");
  const user = await findUser(email);
  if (!user) return Response.json({ error: "Admin not found" });
  await run("UPDATE users SET password = ?, updated_at = datetime('now') WHERE email = ?", [hash, email]);
  return Response.json({ message: "Password reset", email, password: newPassword });
}
