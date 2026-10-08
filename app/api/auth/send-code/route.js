import { run, get } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const existing = await get("SELECT metadata FROM email_verifications WHERE email = ?", [email]);
    const metadata = existing?.metadata || null;

    await run(
      "INSERT OR REPLACE INTO email_verifications (email, code, expires_at, attempts, metadata, created_at) VALUES (?, ?, ?, 0, ?, datetime('now'))",
      [email, code, expiresAt, metadata]
    );

    // Best-effort resend: never block with an error when the SMTP relay hiccups.
    try {
      await sendVerificationEmail(email, code);
    } catch (sendErr) {
      console.error("send-code: failed to send verification email:", sendErr);
    }

    return Response.json({ ok: true, message: "Verification code sent to your email" });
  } catch (err) {
    console.error("send-code error:", err);
    return Response.json({ error: err.message || "Failed to send verification code" }, { status: 500 });
  }
}