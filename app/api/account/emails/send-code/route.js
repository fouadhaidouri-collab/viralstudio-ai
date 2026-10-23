import crypto from "crypto";
import { run, get, query } from "../../../../../lib/db";
import { getServerSession } from "../../../../lib/session";
import { findUserById } from "../../../../lib/userStore";
import { sendAccountEmailCode } from "../../../../../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 3;

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.sub) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const purpose = body?.purpose;
    if (purpose !== "change" && purpose !== "add") {
      return Response.json({ error: "Invalid purpose" }, { status: 400 });
    }

    const email = String(body?.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const user = await findUserById(session.sub);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (purpose === "change" && !user.password) {
      return Response.json({ error: "Google accounts cannot change their email here." }, { status: 400 });
    }

    const primary = await get("SELECT id, email FROM users WHERE lower(email) = lower(?)", [email]);
    const extra = await get("SELECT id, user_id, email FROM user_emails WHERE lower(email) = lower(?)", [email]);
    const extras = await query("SELECT id FROM user_emails WHERE user_id = ?", [session.sub]);

    if (purpose === "change") {
      if (primary && primary.id === session.sub) {
        return Response.json({ error: "This is already your primary email." }, { status: 400 });
      }
      if (primary && primary.id !== session.sub) {
        return Response.json({ error: "This email is already used by another account." }, { status: 409 });
      }
      if (extra && extra.user_id !== session.sub) {
        return Response.json({ error: "This email is already linked to another account." }, { status: 409 });
      }
    } else {
      if (primary) {
        return Response.json({
          error: primary.id === session.sub
            ? "This is already your primary email."
            : "This email is already used by another account.",
        }, { status: 409 });
      }
      if (extra) {
        return Response.json({
          error: extra.user_id === session.sub
            ? "This email is already added."
            : "This email is already linked to another account.",
        }, { status: 409 });
      }
      if (1 + extras.length >= MAX_EMAILS) {
        return Response.json({ error: "You can have a maximum of 3 emails." }, { status: 400 });
      }
    }

    const code = crypto.randomInt(10000000, 100000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const metadata = JSON.stringify({ user_id: session.sub, purpose });

    await run("DELETE FROM email_verifications WHERE email = ?", [email]);
    await run(
      "INSERT INTO email_verifications (email, code, expires_at, attempts, metadata, created_at) VALUES (?, ?, ?, 0, ?, datetime('now'))",
      [email, code, expiresAt, metadata]
    );

    try {
      await sendAccountEmailCode(email, code, purpose);
    } catch (sendErr) {
      console.error("account email send-code: failed to send:", sendErr);
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      return Response.json({ error: "Could not send the verification email. Please try again." }, { status: 502 });
    }

    return Response.json({ ok: true, email, message: "Verification code sent." });
  } catch (err) {
    console.error("account email send-code error:", err);
    return Response.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
