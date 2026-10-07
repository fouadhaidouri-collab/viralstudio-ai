import crypto from "crypto";
import { run } from "../../../../lib/db";
import { findUser } from "../../../lib/userStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check the email's domain via DNS-over-HTTPS (dns.google), so it works on any
// runtime and doesn't depend on the local resolver. Returns false only when the
// domain clearly does not exist (NXDOMAIN for MX + A + AAAA). Lenient otherwise.
async function emailDomainExists(email) {
  const domain = String(email).split("@")[1];
  const check = async (type) => {
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) return "unknown";
      const data = await res.json();
      if (data.Status === 3) return false; // NXDOMAIN -> domain does not exist
      return true;
    } catch {
      return "unknown"; // DNS hiccup -> do not block valid users
    }
  };
  const results = await Promise.all([check("MX"), check("A"), check("AAAA")]);
  if (results.includes(true)) return true;
  if (results.every((r) => r === false)) return false;
  return true;
}

function generateCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function POST(request) {
  try {
    const { name, email, password, ref_code } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (!EMAIL_RE.test(String(email).trim())) {
      return Response.json({ error: "This email address does not exist. Please check and try again." }, { status: 400 });
    }
    if (!(await emailDomainExists(email))) {
      return Response.json({ error: "This email address does not exist. Please check and try again." }, { status: 400 });
    }

    const skipVerification =
      process.env.AUTH_SKIP_EMAIL_VERIFICATION === "true" ||
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "false";

    // Email verification is required on first signup. Sign-in is never blocked by it.
    if (skipVerification) {
      const { createUser } = await import("../../../lib/userStore");
      const { getAffiliateByReferralCode, createReferral } = await import("../../../../lib/affiliateStore");
      const user = await createUser(name, email.trim(), password);
      await run("UPDATE users SET email_verified = 1 WHERE email = ?", [email.trim()]);
      if (ref_code) {
        try {
          const affiliate = await getAffiliateByReferralCode(ref_code);
          if (affiliate && affiliate.user_id !== user.id) {
            await createReferral({ affiliate_id: affiliate.id, referred_user_id: user.id });
          }
        } catch {}
      }
      return Response.json({ ok: true, verification_required: false, email: user.email }, { status: 201 });
    }

    // If the email already belongs to an account, do not send a code for it.
    const existing = await findUser(email.trim());
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const password_hash = crypto.createHash("sha256").update(password).digest("hex");

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const metadata = JSON.stringify({ name, password_hash, ref_code: ref_code || "" });

    await run("DELETE FROM email_verifications WHERE email = ?", [email.trim()]);

    await run(
      "INSERT INTO email_verifications (email, code, expires_at, attempts, metadata, created_at) VALUES (?, ?, ?, 0, ?, datetime('now'))",
      [email.trim(), code, expiresAt, metadata]
    );

    // If the address cannot receive mail, tell the user the email doesn't exist
    // instead of pretending the code was sent.
    try {
      const { sendVerificationEmail } = await import("../../../../lib/email");
      const info = await sendVerificationEmail(email.trim(), code);
      if (info?.rejected?.length) {
        throw new Error("Email rejected by server");
      }
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
      await run("DELETE FROM email_verifications WHERE email = ?", [email.trim()]);
      return Response.json(
        { error: "This email address does not exist or cannot receive emails. Please check and try again." },
        { status: 400 }
      );
    }

    return Response.json({ verification_sent: true, email: email.trim() }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("signup error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}