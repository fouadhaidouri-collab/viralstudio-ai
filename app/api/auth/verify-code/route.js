import { run, get } from "../../../../lib/db";

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return Response.json({ error: "Email and code are required" }, { status: 400 });
    }

    const verification = await get("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (!verification) {
      return Response.json({ error: "No verification code found. Please request a new code." }, { status: 400 });
    }

    if (verification.code !== code) {
      await run("UPDATE email_verifications SET attempts = COALESCE(attempts, 0) + 1 WHERE email = ?", [email]);
      const remaining = 4 - (verification.attempts || 0) - 1;
      if (remaining <= 0) {
        await run("DELETE FROM email_verifications WHERE email = ?", [email]);
        return Response.json({ error: "Too many failed attempts. Please request a new code." }, { status: 400 });
      }
      return Response.json({ error: `Invalid code. ${remaining} attempt(s) remaining.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    if (verification.expires_at < now) {
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      return Response.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    await run("UPDATE users SET email_verified = 1 WHERE email = ?", [email]);
    await run("DELETE FROM email_verifications WHERE email = ?", [email]);

    return Response.json({ ok: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("verify-code error:", err);
    return Response.json({ error: err.message || "Failed to verify code" }, { status: 500 });
  }
}
