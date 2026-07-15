import crypto from "crypto";
import { run, get } from "../../../../lib/db";
import { findUser } from "../../../lib/userStore";
import { getAffiliateByReferralCode, createReferral } from "../../../../lib/affiliateStore";

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

    const existing = await findUser(email);
    if (existing) {
      await run("UPDATE users SET email_verified = 1 WHERE email = ?", [email]);
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      return Response.json({ ok: true, message: "Email verified successfully" });
    }

    let metadata = {};
    try { metadata = JSON.parse(verification.metadata || "{}"); } catch {}

    const id = String(Math.floor(10000000 + Math.random() * 90000000));
    await run(
      "INSERT INTO users (id, name, email, password, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      [id, metadata.name || email, email, metadata.password_hash || ""]
    );

    if (metadata.ref_code) {
      try {
        const affiliate = await getAffiliateByReferralCode(metadata.ref_code);
        if (affiliate && affiliate.user_id !== id) {
          await createReferral({ affiliate_id: affiliate.id, referred_user_id: id });
        }
      } catch {}
    }

    await run("DELETE FROM email_verifications WHERE email = ?", [email]);

    return Response.json({ ok: true, message: "Email verified successfully", user: { id, name: metadata.name || email, email } });
  } catch (err) {
    console.error("verify-code error:", err);
    return Response.json({ error: err.message || "Failed to verify code" }, { status: 500 });
  }
}
