import { NextResponse } from "next/server";
import { verifyUser } from "../../../lib/userStore";
import { createToken } from "../../../lib/session";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await verifyUser(email, password);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    const token = await createToken(user);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 2592000,
      path: "/",
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
