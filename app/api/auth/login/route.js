import { verifyUser } from "../../../lib/userStore";
import { setSessionCookie } from "../../../lib/session";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await verifyUser(email, password);
    if (!user) {
      return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    const jwt = await setSessionCookie(user);
    const res = Response.json({ ok: true, user });
    return res;
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
