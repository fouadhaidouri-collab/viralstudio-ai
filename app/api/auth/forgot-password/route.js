import { findUser, generateResetToken, saveResetToken } from "../../../lib/userStore";

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
    const resetUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    return Response.json({ message: "Reset link generated", resetUrl }, { status: 200 });
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
