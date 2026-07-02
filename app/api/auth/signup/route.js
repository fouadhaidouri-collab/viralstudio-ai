import { run, get } from "../../../../lib/db";
import { createUser } from "../../../lib/userStore";
import { getAffiliateByReferralCode, createReferral } from "../../../../lib/affiliateStore";

export async function POST(request) {
  try {
    const { name, email, password, ref_code, code } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!code) {
      return Response.json({ error: "Verification code is required" }, { status: 400 });
    }

    const verification = await get("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (!verification) {
      return Response.json({ error: "No verification code found. Please request a new code." }, { status: 400 });
    }
    if (verification.code !== code) {
      await run("UPDATE email_verifications SET attempts = COALESCE(attempts, 0) + 1 WHERE email = ?", [email]);
      const remaining = 4 - (verification.attempts || 0);
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

    const user = await createUser(name, email, password);
    await run("DELETE FROM email_verifications WHERE email = ?", [email]);

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
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
