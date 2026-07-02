import { run, get } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await run(
      "INSERT OR REPLACE INTO email_verifications (email, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, datetime('now'))",
      [email, code, expiresAt]
    );

    await sendVerificationEmail(email, code);

    return Response.json({ ok: true, message: "Verification code sent to your email" });
  } catch (err) {
    console.error("send-code error:", err);
    return Response.json({ error: err.message || "Failed to send verification code" }, { status: 500 });
  }
}
