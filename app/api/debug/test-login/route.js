import { verifyUser } from "../../../lib/userStore";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await verifyUser(email, password);
    if (user) {
      return Response.json({ ok: true, user });
    } else {
      return Response.json({ ok: false, error: "Invalid credentials" });
    }
  } catch (err) {
    return Response.json({ ok: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
