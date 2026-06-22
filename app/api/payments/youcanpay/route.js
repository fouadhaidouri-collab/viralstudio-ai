import { auth } from "../../../lib/auth";
import { PLANS, getPlanPrice, getPlanCredits } from "../../../../lib/paymentTransactions";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { planId, billingCycle } = await req.json();
    if (!planId || !billingCycle) {
      return Response.json({ error: "Missing planId or billingCycle" }, { status: 400 });
    }
    if (!PLANS[planId]) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const publicKey = process.env.YOYCANPAY_PUBLIC_KEY;
    const privateKey = process.env.YOYCANPAY_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return Response.json({ error: "YouCan Pay not configured" }, { status: 500 });
    }

    const annual = billingCycle === "annual";
    const amount = getPlanPrice(planId, annual);
    const planName = PLANS[planId].name;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://viralstudio-ai-rho.vercel.app";

    const payload = {
      amount: (amount * 100).toFixed(0),
      currency: "USD",
      description: `${planName} Plan - ${annual ? "Yearly" : "Monthly"}`,
      success_url: `${appUrl}/pricing`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        user_id: session.user.email,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    };

    const res = await fetch("https://api.youcanpay.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": privateKey,
        "PUBLIC-KEY": publicKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("YouCan Pay error:", data);
      return Response.json({ error: data.message || "YouCan Pay failed" }, { status: res.status });
    }

    return Response.json({
      paymentUrl: data.payment_url || data.url,
      transactionId: data.id,
    });
  } catch (err) {
    console.error("YouCan Pay create error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
