import { auth } from "../../../lib/auth";
import { changePassword } from "../../../lib/userStore";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Current password and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    await changePassword(session.user.email, currentPassword, newPassword);
    return Response.json({ message: "Password changed successfully" }, { status: 200 });
  } catch (err) {
    if (err.message === "Current password is incorrect") {
      return Response.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
