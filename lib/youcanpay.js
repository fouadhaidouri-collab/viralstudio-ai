import crypto from "crypto";

// YouCan Pay (https://youcanpay.com) integration helper.
//
// Env (either spelling works; the correctly-spelled one wins):
//   YOUCANPAY_PRIVATE_KEY / YOUCANPAY_PUBLIC_KEY
//   YOYCANPAY_PRIVATE_KEY / YOYCANPAY_PUBLIC_KEY   (legacy typo, kept for compatibility)
//
// Sandbox keys look like pri_sandbox_xxx / pub_sandbox_xxx and use:
//   Tokenize: POST https://youcanpay.com/sandbox/api/tokenize
//   Verify:   GET  https://youcanpay.com/sandbox/api/transactions/{id}?pri_key=...
// Live keys use:
//   Tokenize: POST https://youcanpay.com/api/tokenize
//   Verify:   GET  https://youcanpay.com/api/v2/transactions/{id}   (Basic auth)
//
// Webhook signature: HMAC-SHA256(rawBody, privateKey) hex in X-YOUCANPAY-SIGNATURE.
// There are NO hardcoded keys: if the env vars are missing, tokenize/verify fail safely.

function envKey(...names) {
  for (const name of names) {
    const value = (process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}

export function youcanKeys() {
  const privateKey = envKey("YOUCANPAY_PRIVATE_KEY", "YOYCANPAY_PRIVATE_KEY");
  const publicKey = envKey("YOUCANPAY_PUBLIC_KEY", "YOYCANPAY_PUBLIC_KEY");
  const isSandbox = privateKey.includes("sandbox") || publicKey.includes("sandbox");
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
  if (!privateKey) {
    return { ok: false, error: "YouCan Pay is not configured: set YOUCANPAY_PRIVATE_KEY", status: 500 };
  }

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
  return {
    ok: true,
    tokenId: String(tokenId),
    transactionId: data.transaction_id ? String(data.transaction_id) : null,
  };
}

// Sandbox v1 returns a numeric status (1 = paid); live v2 returns a string ("paid").
function normalizeStatus(raw) {
  if (raw === 1 || raw === "1" || raw === "paid" || raw === "success") return "paid";
  if (raw === 0 || raw === "0" || raw === "pending" || raw === "created") return "pending";
  if (raw === 2 || raw === "2" || raw === "canceled" || raw === "cancelled") return "canceled";
  if (raw === 3 || raw === "3" || raw === "failed") return "failed";
  if (raw === 4 || raw === "4" || raw === "refunded") return "refunded";
  return String(raw ?? "").toLowerCase();
}

// Look up a YouCan Pay transaction by its YouCan Pay transaction id.
export async function fetchTransaction(transactionId) {
  if (!transactionId) return { ok: false, data: null, status: "missing" };

  const { privateKey, apiBase, isSandbox } = youcanKeys();
  if (!privateKey) return { ok: false, data: null, error: "YouCan Pay is not configured" };

  const url = isSandbox
    ? `${apiBase}/transactions/${encodeURIComponent(transactionId)}?pri_key=${encodeURIComponent(privateKey)}`
    : `${apiBase}/v2/transactions/${encodeURIComponent(transactionId)}`;

  const headers = { Accept: "application/json" };
  if (!isSandbox) headers.Authorization = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

  const res = await fetch(url, { headers });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!res.ok || !data) return { ok: false, data: null, status: res.status };

  return {
    ok: true,
    data,
    status: normalizeStatus(data.status),
    orderId: data.order_id ? String(data.order_id) : null,
  };
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
