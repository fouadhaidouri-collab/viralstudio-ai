import { auth } from "../../../../lib/auth";
import { createTransaction } from "../../../../../lib/paymentTransactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_PRICE_ENV = {
  beginner: "PADDLE_PRICE_ID_BEGINNER",
  builder: "PADDLE_PRICE_ID_BUILDER",
  creator: "PADDLE_PRICE_ID_CREATOR",
  pro: "PADDLE_PRICE_ID_PRO",
  elite: "PADDLE_PRICE_ID_ELITE",
  ultimate: "PADDLE_PRICE_ID_ULTIMATE",
};

const TEST_PRICE_ENV = {
  beginner: "PADDLE_TEST_PRICE_ID_BEGINNER",
  builder: "PADDLE_TEST_PRICE_ID_BUILDER",
  creator: "PADDLE_TEST_PRICE_ID_CREATOR",
  pro: "PADDLE_TEST_PRICE_ID_PRO",
  elite: "PADDLE_TEST_PRICE_ID_ELITE",
  ultimate: "PADDLE_TEST_PRICE_ID_ULTIMATE",
};

const PACKS = {
  beginner: { amount: 10, credits: 1000 },
  builder: { amount: 25, credits: 2625 },
  creator: { amount: 50, credits: 5500 },
  pro: { amount: 100, credits: 11500 },
  elite: { amount: 200, credits: 24000 },
  ultimate: { amount: 500, credits: 60000 },
};

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });

    const { planId, billingCycle = "one_time" } = await req.json();
    const pack = PACKS[planId];
    const isSandbox = process.env.PADDLE_ENVIRONMENT === "sandbox";
    const priceEnv = (isSandbox ? TEST_PRICE_ENV : LIVE_PRICE_ENV)[planId];
    const priceId = priceEnv ? process.env[priceEnv] : null;
    const clientToken = isSandbox
      ? process.env.NEXT_PUBLIC_PADDLE_TEST_CLIENT_TOKEN
      : process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!pack || !priceEnv) return Response.json({ error: "Invalid credit pack" }, { status: 400 });
    if (!clientToken || !priceId) {
      return Response.json({ error: "Paddle is not fully configured yet. Add the Paddle client token and six catalog price IDs." }, { status: 503 });
    }

    const userId = session.user.id || session.user.email;
    const tx = await createTransaction({
      userId, provider: isSandbox ? "paddle_sandbox" : "paddle", planId, billingCycle,
      amount: pack.amount, currency: "USD", credits: pack.credits, status: "pending",
    });

    return Response.json({
      transactionId: tx.id, userId, planId, credits: pack.credits,
      priceId, clientToken,
      environment: isSandbox ? "sandbox" : "production",
    });
  } catch (error) {
    console.error("Paddle checkout initialization failed:", error);
    return Response.json({ error: "Unable to initialize payment" }, { status: 500 });
  }
}
