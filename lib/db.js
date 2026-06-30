const CF_ACCOUNT = "8e54767bc972da1bc5ce41bd8763131a";
const CF_DB_ID = "07f34eb4-9007-4b91-893f-ddcb9d7f9694";
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${CF_DB_ID}`;

function getToken() {
  const token = process.env.CLOUDFLARE_D1_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_D1_TOKEN env not set");
  return token;
}

async function request(sql, params = []) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
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
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
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
