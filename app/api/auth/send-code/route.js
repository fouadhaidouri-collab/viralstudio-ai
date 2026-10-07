import { run, get } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

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

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return Response.json({ error: "This email address does not exist. Please check and try again." }, { status: 400 });
    }
    if (!(await emailDomainExists(email))) {
      return Response.json({ error: "This email address does not exist. Please check and try again." }, { status: 400 });
    }

    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const existing = await get("SELECT metadata FROM email_verifications WHERE email = ?", [email]);
    const metadata = existing?.metadata || null;

    await run(
      "INSERT OR REPLACE INTO email_verifications (email, code, expires_at, attempts, metadata, created_at) VALUES (?, ?, ?, 0, ?, datetime('now'))",
      [email, code, expiresAt, metadata]
    );

    // If the address cannot receive mail, tell the user the email doesn't exist
    // instead of pretending the code was sent.
    try {
      const info = await sendVerificationEmail(email, code);
      if (info?.rejected?.length) {
        throw new Error("Email rejected by server");
      }
    } catch (sendErr) {
      console.error("send-code email error:", sendErr);
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      return Response.json(
        { error: "This email address does not exist or cannot receive emails. Please check and try again." },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, message: "Verification code sent to your email" });
  } catch (err) {
    console.error("send-code error:", err);
    return Response.json({ error: err.message || "Failed to send verification code" }, { status: 500 });
  }
}