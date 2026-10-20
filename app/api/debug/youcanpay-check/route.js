import { NextResponse } from "next/server";
import { youcanKeys, fetchTransaction } from "@/lib/youcanpay";

// Diagnostic: reports which YouCan Pay env names are configured (never the key
// values) and whether the site will talk to the sandbox or the live API.
// Mirrors /api/debug/d1-check.
//
// Add ?transactionId=<youcanpay id> to look up a payment's status at YouCan Pay
// (status/order/amount only — no customer data, no keys).
export async function GET(req) {
  const { privateKey, publicKey, isSandbox, apiBase, webBase } = youcanKeys();

  const privateKeyFrom = process.env.YOUCANPAY_PRIVATE_KEY
    ? "YOUCANPAY_PRIVATE_KEY"
    : process.env.YOYCANPAY_PRIVATE_KEY
      ? "YOYCANPAY_PRIVATE_KEY"
      : null;
  const publicKeyFrom = process.env.YOUCANPAY_PUBLIC_KEY
    ? "YOUCANPAY_PUBLIC_KEY"
    : process.env.YOYCANPAY_PUBLIC_KEY
      ? "YOYCANPAY_PUBLIC_KEY"
      : null;

  const transactionId = new URL(req.url).searchParams.get("transactionId");
  let lookup = null;
  if (transactionId) {
    const remote = await fetchTransaction(transactionId);
    lookup = {
      ok: remote.ok,
      status: remote.status,
      orderId: remote.orderId || null,
      providerStatus: remote.ok ? remote.data?.status ?? null : null,
      amount: remote.ok ? remote.data?.amount ?? null : null,
      currency: remote.ok ? remote.data?.currency ?? null : null,
    };
  }

  return NextResponse.json({
    configured: Boolean(privateKey && publicKey),
    mode: isSandbox ? "sandbox" : "live",
    hasPrivateKey: Boolean(privateKey),
    hasPublicKey: Boolean(publicKey),
    privateKeyFrom,
    publicKeyFrom,
    apiBase,
    webBase,
    ...(lookup ? { transaction: lookup } : {}),
  });
}
