import { verifyResetToken, updatePassword } from "../../../lib/userStore";

export async function POST(request) {
  try {
    const { email, token, password } = await request.json();
    if (!email || !token || !password) {
      return Response.json({ error: "Email, token, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const valid = await verifyResetToken(email, token);
    if (!valid) {
      return Response.json({ error: "Invalid or expired reset link" }, { status: 401 });
    }
    await updatePassword(email, password);
    return Response.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
