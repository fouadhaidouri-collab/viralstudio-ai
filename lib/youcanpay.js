import crypto from "crypto";

// YouCan Pay (https://youcanpay.com) integration helper.
//
//   Tokenize : POST {apiBase}/tokenize  -> { transaction_id, token: { id } }
//   Pay      : {webBase}/payment-form/<tokenId>          (standalone redirect)
//   Verify   : GET  {apiBase}/v2/transactions/<id>       (Basic auth = private key)
//   Webhook  : X-YOUCANPAY-SIGNATURE = HMAC-SHA256(rawBody, privateKey) hex
//
// Env vars YOUCANPAY_PUBLIC_KEY / YOUCANPAY_PRIVATE_KEY win when set; the
// sandbox defaults below keep the test flow working out of the box. Always
// override with live keys via env before going live.

const FALLBACK_PUBLIC_KEY = "pub_sandbox_f75c59db-fbfa-4301-8201-293cd";
const FALLBACK_PRIVATE_KEY = "pri_sandbox_f71108fb-04d8-45cc-8d20-ead16";

export function youcanKeys() {
  const privateKey = (process.env.YOUCANPAY_PRIVATE_KEY || FALLBACK_PRIVATE_KEY || "").trim();
  const publicKey = (process.env.YOUCANPAY_PUBLIC_KEY || FALLBACK_PUBLIC_KEY || "").trim();
  const isSandbox = privateKey.includes("sandbox");
  const apiBase = isSandbox ? "https://youcanpay.com/sandbox/api" : "https://youcanpay.com/api";
  const webBase = isSandbox ? "https://youcanpay.com/sandbox" : "https://youcanpay.com";
  return { privateKey, publicKey, isSandbox, apiBase, webBase };
}

export function paymentFormUrl(tokenId) {
  const { webBase } = youcanKeys();
  return `${webBase}/payment-form/${tokenId}`;
}

export async function tokenizePayment({
  orderId,
  amountMinor,
  currency = "USD",
  customerIp,
  successUrl,
  errorUrl,
  customer,
  metadata,
}) {
  const { privateKey, apiBase } = youcanKeys();
  const res = await fetch(`${apiBase}/tokenize`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      pri_key: privateKey,
      order_id: orderId,
      amount: String(Math.round(amountMinor)),
      currency,
      customer_ip: customerIp,
      success_url: successUrl,
      error_url: errorUrl,
      customer: customer || {},
      metadata: metadata || {},
    }),
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!data) {
    return { ok: false, error: "YouCanPay returned a non-JSON response", raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    return { ok: false, error: data.message || data.error || "YouCanPay request failed", status: res.status };
  }

  // Docs show both `token` as a string and `token: { id }`.
  const tokenId = data.token && (data.token.id || data.token);
  if (!tokenId) {
    return { ok: false, error: "No payment token returned by YouCanPay" };
  }
  return { ok: true, tokenId: String(tokenId), transactionId: data.transaction_id ? String(data.transaction_id) : null };
}

export async function fetchTransaction(transactionId) {
  const { privateKey, apiBase } = youcanKeys();
  const res = await fetch(`${apiBase}/v2/transactions/${encodeURIComponent(transactionId)}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
    },
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!res.ok || !data) return { ok: false, data: null };
  return { ok: true, data, status: String(data.status || "").toLowerCase() };
}

export function verifyWebhookSignature(rawBody, signature) {
  const { privateKey } = youcanKeys();
  if (!rawBody || !signature || !privateKey) return false;
  const expected = crypto.createHmac("sha256", privateKey).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}