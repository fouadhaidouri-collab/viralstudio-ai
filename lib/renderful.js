import fs from "fs";
import path from "path";
import { get, run } from "./db.js";

export const RENDERFUL_BASE = "https://api.renderful.ai/api/v1";

const SETTINGS_PATH = path.join(process.cwd(), "data", "app-settings.json");

async function ensureProviderSecretsTable() {
  await run(`CREATE TABLE IF NOT EXISTS provider_secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}

export async function getRenderfulKey() {
  // Prefer the key managed from Admin Settings so an admin can rotate it
  // without changing deployment environment variables. Fall back to env for
  // first-time setup and local/production recovery.
  try {
    await ensureProviderSecretsTable();
    const stored = await get(
      "SELECT value FROM provider_secrets WHERE key = ?",
      ["renderful_api_key"]
    );
    if (stored?.value) {
      return { hasKey: true, source: "database", key: stored.value };
    }
  } catch (err) {
    if (process.env.VERCEL) throw err;
  }

  const envKey = (process.env.RENDERFUL_API_KEY || "").trim();
  if (envKey) {
    return { hasKey: true, source: "env", key: envKey };
  }

  // Local development fallback only. Do not rely on this file in production.
  if (!process.env.VERCEL) {
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
        if (data.renderful_api_key) {
          return { hasKey: true, source: "file", key: data.renderful_api_key };
        }
      }
    } catch {}
  }

  return {
    hasKey: false,
    setupRequired: true,
    error: "Renderful API key is missing. Add it from Admin Settings.",
  };
}

export async function saveRenderfulKey(key) {
  const cleanKey = String(key || "").trim();
  if (!cleanKey) throw new Error("Renderful API key is empty.");

  if (process.env.VERCEL) {
    await ensureProviderSecretsTable();
    await run(
      `INSERT INTO provider_secrets (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = datetime('now')`,
      ["renderful_api_key", cleanKey]
    );
    return;
  }

  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = fs.existsSync(SETTINGS_PATH)
    ? JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"))
    : {};
  data.renderful_api_key = cleanKey;
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return key.slice(0, 4) + "********" + key.slice(-4);
}

async function renderfulFetch(pathname, options = {}) {
  const keyResult = await getRenderfulKey();
  if (!keyResult.hasKey) {
    const error = new Error(keyResult.error);
    error.code = "NO_KEY";
    throw error;
  }

  const headers = {
    Authorization: `Bearer ${keyResult.key}`,
    ...(options.headers || {}),
  };

  return fetch(`${RENDERFUL_BASE}${pathname}`, {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(45000),
  });
}

export async function submitGeneration(body) {
  const res = await renderfulFetch("/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || data.error || `Renderful error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export async function getGeneration(id) {
  const res = await renderfulFetch(`/generations/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || data.error || `Renderful status error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function testRenderfulKey(key) {
  const res = await fetch(`${RENDERFUL_BASE}/account/balance`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    return { valid: false, message: `Renderful rejected the key (HTTP ${res.status}).` };
  }
  const data = await res.json().catch(() => ({}));
  return {
    valid: true,
    message: "Renderful key works",
    balance: data.balance_available ?? data.balance ?? null,
    tier: data.tier || null,
  };
}

export function outputUrl(data) {
  if (!data) return null;
  if (typeof data.output === "string") return data.output;
  if (Array.isArray(data.outputs) && data.outputs.length > 0) {
    const first = data.outputs[0];
    return typeof first === "string" ? first : first?.url || null;
  }
  return (
    data.video_url ||
    data.video?.url ||
    data.image_url ||
    data.image?.url ||
    data.audio_url ||
    data.audio?.url ||
    null
  );
}

export function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "COMPLETED" || value === "SUCCEEDED" || value === "SUCCESS") return "COMPLETED";
  if (value === "FAILED" || value === "ERROR" || value === "CANCELLED" || value === "CANCELED") {
    return value === "CANCELED" ? "CANCELLED" : value;
  }
  if (value === "IN_PROGRESS" || value === "RUNNING") return "PROCESSING";
  return value || "QUEUED";
}
