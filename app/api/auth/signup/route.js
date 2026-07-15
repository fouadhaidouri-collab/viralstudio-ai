import crypto from "crypto";
import { run } from "../../../../lib/db";

export async function POST(request) {
  try {
    const { name, email, password, ref_code } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const password_hash = crypto.createHash("sha256").update(password).digest("hex");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const metadata = JSON.stringify({ name, password_hash, ref_code: ref_code || "" });

    await run("DELETE FROM email_verifications WHERE email = ?", [email]);

    await run(
      "INSERT INTO email_verifications (email, code, expires_at, attempts, metadata, created_at) VALUES (?, ?, ?, 0, ?, datetime('now'))",
      [email, code, expiresAt, metadata]
    );

    if (process.env.SMTP_HOST) {
      try {
        const { sendVerificationEmail } = await import("../../../../lib/email");
        await sendVerificationEmail(email, code);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }
    }

    return Response.json({ verification_sent: true, email }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
