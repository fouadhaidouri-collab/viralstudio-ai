import { NextResponse } from "next/server";
import { youcanKeys } from "@/lib/youcanpay";

// Diagnostic: reports which YouCan Pay env names are configured (never the key
// values) and whether the site will talk to the sandbox or the live API.
// Mirrors /api/debug/d1-check.
export async function GET() {
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

  return NextResponse.json({
    configured: Boolean(privateKey && publicKey),
    mode: isSandbox ? "sandbox" : "live",
    hasPrivateKey: Boolean(privateKey),
    hasPublicKey: Boolean(publicKey),
    privateKeyFrom,
    publicKeyFrom,
    apiBase,
    webBase,
  });
}
