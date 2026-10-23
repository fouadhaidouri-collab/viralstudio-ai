import crypto from "crypto";
import { run, get, query } from "../../../../../lib/db";
import { getServerSession, setSessionCookie } from "../../../../lib/session";
import { findUserById } from "../../../../lib/userStore";

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
    const code = String(body?.code || "").trim();
    if (!email || !code) {
      return Response.json({ error: "Email and code are required" }, { status: 400 });
    }

    const verification = await get("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (!verification) {
      return Response.json({ error: "No verification code found. Please request a new code." }, { status: 400 });
    }

    let metadata = {};
    try {
      metadata = JSON.parse(verification.metadata || "{}");
    } catch {}
    if (metadata.user_id !== session.sub || metadata.purpose !== purpose) {
      return Response.json({ error: "This verification code is not valid for this action." }, { status: 400 });
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

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      return Response.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    const user = await findUserById(session.sub);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const primary = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
    const extra = await get("SELECT id, user_id FROM user_emails WHERE lower(email) = lower(?)", [email]);

    if (purpose === "change") {
      if (!user.password) {
        return Response.json({ error: "Google accounts cannot change their email here." }, { status: 400 });
      }
      if (primary && primary.id !== session.sub) {
        return Response.json({ error: "This email is already used by another account." }, { status: 409 });
      }
      if (extra && extra.user_id !== session.sub) {
        return Response.json({ error: "This email is already linked to another account." }, { status: 409 });
      }

      await run(
        "UPDATE users SET email = ?, email_verified = 1, updated_at = datetime('now') WHERE id = ?",
        [email, session.sub]
      );
      // If the new primary email was previously one of the user's extra emails,
      // remove the duplicate row.
      await run("DELETE FROM user_emails WHERE user_id = ? AND lower(email) = lower(?)", [session.sub, email]);
      await run("DELETE FROM email_verifications WHERE email = ?", [email]);
      // Keep the signed-in session in sync with the new primary email.
      await setSessionCookie({ id: user.id, name: user.name, email });

      return Response.json({ ok: true, primary: true, email });
    }

    if (primary) {
      return Response.json({
        error: primary.id === session.sub
          ? "This is already your primary email."
          : "This email is already used by another account.",
      }, { status: 409 });
    }
    if (extra) {
      return Response.json({ error: "This email is already linked to an account." }, { status: 409 });
    }

    const extras = await query("SELECT id FROM user_emails WHERE user_id = ?", [session.sub]);
    if (1 + extras.length >= MAX_EMAILS) {
      return Response.json({ error: "You can have a maximum of 3 emails." }, { status: 400 });
    }

    const id = `email_${crypto.randomUUID()}`;
    try {
      await run(
        "INSERT INTO user_emails (id, user_id, email, verified, created_at, verified_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))",
        [id, session.sub, email]
      );
    } catch (err) {
      if (String(err.message || "").toLowerCase().includes("unique")) {
        return Response.json({ error: "This email is already linked to an account." }, { status: 409 });
      }
      throw err;
    }
    await run("DELETE FROM email_verifications WHERE email = ?", [email]);

    return Response.json({ ok: true, primary: false, email });
  } catch (err) {
    console.error("account email verify error:", err);
    return Response.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
