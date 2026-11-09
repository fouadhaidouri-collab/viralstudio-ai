import { auth } from "../app/lib/auth";
import { findUser } from "../app/lib/userStore";

export async function getAdminAccess() {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const user = await findUser(session.user.email);
  if (!user || user.role !== "admin") {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, session, user };
}
