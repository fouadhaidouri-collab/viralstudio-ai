import { getServerSession } from "../../../lib/session";
import { getUserCreditsBalance, getUserPlan } from "../../../lib/userStore";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ user: null });
  }

  const userId = session.sub || session.email;
  let credits = 0;
  let plan = { plan_name: "Free", plan_id: "free" };

  const [creditsResult, planResult] = await Promise.allSettled([
    getUserCreditsBalance(userId),
    getUserPlan(userId),
  ]);

  if (creditsResult.status === "fulfilled") {
    credits = creditsResult.value ?? 0;
  }
  if (planResult.status === "fulfilled" && planResult.value) {
    plan = planResult.value;
  }

  return Response.json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      credits,
      plan: plan.plan_name || "Free",
      plan_id: plan.plan_id || "free",
    },
  });
}
