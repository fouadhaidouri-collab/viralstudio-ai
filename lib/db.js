// Cloudflare D1 connection (Vercel functions).
//
// Account / DB / email are PUBLIC identifiers (NOT secrets) and are hardcoded
// here ON PURPOSE: stale env vars on Vercel once pointed the app at a retired
// account which broke every DB query with Cloudflare error 9109
// ("The given account is not valid or is not authorized to access this service").
//
// The ONLY secret is the credential, read from CLOUDFLARE_D1_TOKEN (env only).
// Auth is always Cloudflare "Global API Key" mode: X-Auth-Email + X-Auth-Key.
//
// If the Cloudflare account ever changes, update the three values below.

const CF_ACCOUNT = "37002830a20bbd53c74b56de441496c5";
const CF_DB_ID = "e6f4d39c-9d4d-4570-8a3d-5aed60bd83b0";
const CF_EMAIL = "fouadhaidouri@gmail.com";

const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${CF_DB_ID}`;

function getHeaders() {
  const token = process.env.CLOUDFLARE_D1_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_D1_TOKEN env not set");
  return {
    "X-Auth-Email": CF_EMAIL,
    "X-Auth-Key": token,
    "Content-Type": "application/json",
  };
}

// Exposed for diagnostics only. Never includes the credential itself.
export function getD1Config() {
  return {
    account: CF_ACCOUNT,
    db: CF_DB_ID,
    email: CF_EMAIL,
    authMode: "x-auth-key",
    tokenConfigured: Boolean(process.env.CLOUDFLARE_D1_TOKEN),
    tokenLength: (process.env.CLOUDFLARE_D1_TOKEN || "").length,
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