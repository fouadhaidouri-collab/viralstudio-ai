import { NextResponse } from "next/server";
import { verifyUser, getUserCreditsBalance, getUserPlan } from "../../../lib/userStore";
import { createToken } from "../../../lib/session";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await verifyUser(email, password);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    const token = await createToken(user);

    const userId = user.id || user.email;
    let credits = 0;
    let plan = { plan_name: "Free", plan_id: "free" };
    const [creditsResult, planResult] = await Promise.allSettled([
      getUserCreditsBalance(userId),
      getUserPlan(userId),
    ]);
    if (creditsResult.status === "fulfilled") credits = creditsResult.value ?? 0;
    if (planResult.status === "fulfilled" && planResult.value) plan = planResult.value;

    const res = NextResponse.json({
      ok: true,
      user: {
        ...user,
        credits,
        plan: plan.plan_name || "Free",
        plan_id: plan.plan_id || "free",
      },
    });
    res.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2592000,
      path: "/",
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
