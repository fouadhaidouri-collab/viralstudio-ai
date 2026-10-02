// Cloudflare D1 connection (Vercel functions)
//
// IMPORTANT: account / db IDs below are NOT secrets (public identifiers).
// The credential itself comes from the environment (CLOUDFLARE_D1_TOKEN).
//
// Auth mode:
//  - Global API Key  -> X-Auth-Email + X-Auth-Key (default; the current key)
//  - API Token       -> Authorization: Bearer <token>
//
// Old (dead) account/db values are ignored so stale env vars on Vercel can
// never point the app at the retired 403 account.

const DEFAULT_ACCOUNT = "37002830a20bbd53c74b56de441496c5";
const DEFAULT_DB_ID = "e6f4d39c-9d4d-4570-8a3d-5aed60bd83b0";
const DEFAULT_EMAIL = "fouadhaidouri@gmail.com";

// Retired Cloudflare account that returns 403 (do not use).
const DEAD_ACCOUNT = "8e54767bc972da1bc5ce41bd8763131a";
const DEAD_DB_ID = "07f34eb4-9007-4b91-893f-ddcb9d7f9694";

const envOr = (value, fallback) => (value && value.trim() && value !== "-" ? value.trim() : fallback);

let CF_ACCOUNT = envOr(process.env.CLOUDFLARE_D1_ACCOUNT, DEFAULT_ACCOUNT);
let CF_DB_ID = envOr(process.env.CLOUDFLARE_D1_DB_ID, DEFAULT_DB_ID);
if (CF_ACCOUNT === DEAD_ACCOUNT) CF_ACCOUNT = DEFAULT_ACCOUNT;
if (CF_DB_ID === DEAD_DB_ID) CF_DB_ID = DEFAULT_DB_ID;

const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${CF_DB_ID}`;

const looksLikeGlobalKey = (token) =>
  token.startsWith("cfk_") || /^[a-f0-9]{37}$/i.test(token);

function getHeaders() {
  const token = process.env.CLOUDFLARE_D1_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_D1_TOKEN env not set");
  // Global API Key mode: send X-Auth-Email + X-Auth-Key.
  // Use it whenever an email is configured OR the value looks like a global key.
  if (process.env.CLOUDFLARE_D1_EMAIL || looksLikeGlobalKey(token)) {
    const email = envOr(process.env.CLOUDFLARE_D1_EMAIL, DEFAULT_EMAIL);
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": token,
      "Content-Type": "application/json",
    };
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function request(sql, params = []) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 query failed");
  }
  return data.result[0];
}

export async function query(sql, params = []) {
  const result = await request(sql, params);
  return result.results || [];
}

export async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql, params = []) {
  const result = await request(sql, params);
  return result.meta || {};
}

export async function batch(statements) {
  const res = await fetch(`${API_BASE}/batch`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(
      statements.map((s) => ({ sql: s.sql, params: s.params || [] }))
    ),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 batch failed");
  }
  return data.result;
}