import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { PLANS, getPlanPrice } from "../../../../lib/paymentTransactions";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

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
    if (!amount) {
      return Response.json({ error: "Could not determine price" }, { status: 400 });
    }

    const planName = PLANS[planId].name;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://viralstudio-ai-rho.vercel.app";
    const isSandbox = publicKey.startsWith("pub_sandbox_");

    const payload = {
      amount: (amount * 100).toFixed(0),
      currency: "USD",
      description: `${planName} ${annual ? "Yearly" : billingCycle === "weekly" ? "Weekly" : "Monthly"}`,
      success_url: `${appUrl}/pricing?paid=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: JSON.stringify({
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    };

    const baseUrl = isSandbox ? "https://api.youcanpay.com/sandbox" : "https://api.youcanpay.com";
    const apiUrl = `${baseUrl}/v1/transactions`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": privateKey,
        "PUBLIC-KEY": publicKey,
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      const text = await res.text();
      console.error("YouCan Pay non-JSON response:", text.slice(0, 500));
      return Response.json({ error: "YouCan Pay returned an unexpected response. Check your API keys." }, { status: 502 });
    }

    const data = await res.json();
    if (!res.ok) {
      console.error("YouCan Pay error:", data);
      return Response.json({ error: data.message || data.error || "YouCan Pay failed" }, { status: res.status });
    }

    const paymentUrl = data.payment_url || data.url || (data._links?.payment_url?.href);
    if (!paymentUrl) {
      console.error("YouCan Pay no payment URL in response:", data);
      return Response.json({ error: "No payment URL returned from YouCan Pay" }, { status: 502 });
    }

    return Response.json({ paymentUrl, transactionId: data.id });
  } catch (err) {
    console.error("YouCan Pay create error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
