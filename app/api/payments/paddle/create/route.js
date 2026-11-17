import { auth } from "../../../../lib/auth";
import { createTransaction, updateTransaction } from "../../../../../lib/paymentTransactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  let localTransactionId = null;
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });
    if (process.env.PADDLE_ENVIRONMENT !== "sandbox") {
      return Response.json({ error: "Sandbox checkout is not enabled." }, { status: 503 });
    }

    const { planId } = await req.json();
    const pack = PACKS[planId];
    const priceEnv = TEST_PRICE_ENV[planId];
    const priceId = priceEnv ? process.env[priceEnv] : null;
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_TEST_CLIENT_TOKEN;
    const apiKey = process.env.PADDLE_TEST_API_KEY;

    if (!pack || !priceEnv) return Response.json({ error: "Invalid credit pack" }, { status: 400 });
    if (!clientToken || !apiKey || !priceId) {
      console.error("Paddle Sandbox configuration is incomplete", {
        hasClientToken: Boolean(clientToken), hasApiKey: Boolean(apiKey), hasPriceId: Boolean(priceId),
      });
      return Response.json({ error: "Secure checkout is temporarily unavailable." }, { status: 503 });
    }

    const userId = session.user.id || session.user.email;
    const tx = await createTransaction({
      userId, provider: "paddle_sandbox", planId, billingCycle: "one_time",
      amount: pack.amount, currency: "USD", credits: pack.credits, status: "pending",
    });
    localTransactionId = tx.id;

    const paddleResponse = await fetch("https://sandbox-api.paddle.com/transactions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        currency_code: "USD",
        collection_mode: "automatic",
        enable_checkout: true,
        custom_data: { transactionId: tx.id, userId: String(userId), planId, credits: pack.credits },
      }),
      cache: "no-store",
    });

    const paddlePayload = await paddleResponse.json().catch(() => ({}));
    if (!paddleResponse.ok || !paddlePayload?.data?.id) {
      console.error("Paddle Sandbox transaction creation failed", {
        status: paddleResponse.status,
        error: paddlePayload?.error?.code || paddlePayload?.error?.type || "unknown",
        detail: paddlePayload?.error?.detail || null,
      });
      await updateTransaction(tx.id, { status: "failed" });
      return Response.json({ error: "Paddle could not create the secure checkout. Please try again." }, { status: 502 });
    }

    await updateTransaction(tx.id, { transactionId: paddlePayload.data.id });
    return Response.json({
      transactionId: tx.id,
      paddleTransactionId: paddlePayload.data.id,
      clientToken,
      environment: "sandbox",
    });
  } catch (error) {
    console.error("Paddle Sandbox checkout initialization failed:", error);
    if (localTransactionId) {
      try { await updateTransaction(localTransactionId, { status: "failed" }); }
      catch (updateError) { console.error("Could not mark failed Paddle initialization:", updateError); }
    }
    return Response.json({ error: "Unable to initialize secure checkout." }, { status: 500 });
  }
}
