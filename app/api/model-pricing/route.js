import { getRenderfulKey, RENDERFUL_BASE } from "@/lib/renderful";
import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "data", "provider-model-prices.json");

function readCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {}
  return {};
}

function writeCacheEntry(eid, entry) {
  try {
    const all = readCache();
    all[eid] = { ...entry, last_synced_at: new Date().toISOString() };
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(all, null, 2), "utf-8");
  } catch {}
}

function priceForModel(model) {
  const min = Number(model?.cost?.min);
  if (!Number.isFinite(min)) return null;
  if (model.type === "image-to-video" || model.type === "text-to-video") {
    return { unitPrice: min / 5, unit: "second" };
  }
  return { unitPrice: min, unit: "image" };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpointIds = searchParams.get("endpoint_ids");

  if (!endpointIds) {
    return Response.json({ error: "Missing endpoint_ids" }, { status: 400 });
  }

  const keyResult = await getRenderfulKey();
  if (!keyResult.hasKey) {
    return Response.json({ success: false, setupRequired: true, error: keyResult.error }, { status: 200 });
  }

  const ids = endpointIds.split(",").filter(Boolean);
  const cache = readCache();
  const pricingMap = {};

  let catalog = null;
  try {
    const res = await fetch(`${RENDERFUL_BASE}/models`, {
      headers: { Authorization: `Bearer ${keyResult.key}` },
    });
    if (res.ok) {
      const data = await res.json();
      catalog = Array.isArray(data.models) ? data.models : [];
    }
  } catch {}

  const byId = new Map();
  if (catalog) {
    for (const model of catalog) {
      if (!byId.has(model.id)) byId.set(model.id, model);
    }
  }

  for (const eid of ids) {
    const model = byId.get(eid);
    const live = model ? priceForModel(model) : null;

    if (live) {
      const entry = {
        endpoint_id: eid,
        unit_price: live.unitPrice,
        unit: live.unit,
        currency: "USD",
        pricing_unavailable: false,
        provider: "renderful",
      };
      writeCacheEntry(eid, entry);
      pricingMap[eid] = {
        unitPrice: live.unitPrice,
        unit: live.unit,
        pricingUnavailable: false,
        lastSyncedAt: entry.last_synced_at,
      };
    } else if (cache[eid]) {
      pricingMap[eid] = {
        unitPrice: cache[eid].unit_price ?? null,
        unit: cache[eid].unit || null,
        pricingUnavailable: cache[eid].unit_price == null,
        lastSyncedAt: cache[eid].last_synced_at || null,
      };
    } else {
      pricingMap[eid] = { unitPrice: null, pricingUnavailable: true };
    }
  }

  return Response.json({ success: true, prices: pricingMap });
}
