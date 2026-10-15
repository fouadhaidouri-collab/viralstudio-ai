import { findUser, generateResetToken, saveResetToken } from "../../../lib/userStore";
import { sendPasswordResetEmail } from "../../../../lib/email";

function getOrigin(request) {
  // Prefer an explicit configured URL; otherwise derive it from the incoming
  // request so the link works on the real domain in production.
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }
    const user = await findUser(email);
    if (!user) {
      return Response.json({ error: "No account found with this email" }, { status: 404 });
    }
    const token = generateResetToken();
    await saveResetToken(email, token);
    const resetUrl = `${getOrigin(request)}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Email the reset link to the user.
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailErr) {
      console.error("forgot-password: failed to send reset email:", emailErr);
      return Response.json(
        { error: "Could not send the reset email. Please try again later." },
        { status: 500 }
      );
    }

    return Response.json({ message: "We've emailed you a link to reset your password." }, { status: 200 });
  } catch (err) {
    console.error("forgot-password error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}