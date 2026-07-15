import { run, get } from "../../../../lib/db";
import { createUser } from "../../../lib/userStore";
import { getAffiliateByReferralCode, createReferral } from "../../../../lib/affiliateStore";

export async function POST(request) {
  try {
    const { name, email, password, ref_code } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await createUser(name, email, password);

    const refCode = request.cookies?.get?.("ref_code")?.value || ref_code;
    if (refCode) {
      const affiliate = await getAffiliateByReferralCode(refCode);
      if (affiliate && affiliate.user_id !== user.id) {
        await createReferral({
          affiliate_id: affiliate.id,
          referred_user_id: user.id,
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await run(
      "INSERT OR REPLACE INTO email_verifications (email, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, datetime('now'))",
      [email, code, expiresAt]
    );

    try {
      const { sendVerificationEmail } = await import("../../../../lib/email");
      await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return Response.json({ user, verification_sent: true }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
