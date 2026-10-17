import fs from "fs";
import path from "path";
import { getFalKey } from "./fal-key";
import { getCreditSettings } from "./pricing";
import { parseFalSchema, generateSchemaHash, generatePriceHash } from "./schema-parser";

const DATA_DIR = path.join(process.cwd(), "data");
const MODULES_PATH = path.join(DATA_DIR, "ai-modules.json");
const SYNC_LOGS_PATH = path.join(DATA_DIR, "ai-module-sync-logs.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {}
  return fallback;
}

function writeJson(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Module CRUD ──

export function getAllModules() {
  return readJson(MODULES_PATH, {});
}

export function getModule(moduleId) {
  const all = getAllModules();
  return all[moduleId] || null;
}

function saveModuleRaw(moduleId, data) {
  const all = getAllModules();
  all[moduleId] = { ...data, module_id: moduleId, updated_at: new Date().toISOString() };
  writeJson(MODULES_PATH, all);
  return all[moduleId];
}

export function deleteModule(moduleId) {
  const all = getAllModules();
  delete all[moduleId];
  writeJson(MODULES_PATH, all);
}

export function getEnabledModules() {
  const all = getAllModules();
  return Object.fromEntries(
    Object.entries(all).filter(([, m]) => m.business_config?.enabled !== false)
  );
}

// ── Sync Logging ──

function addSyncLog(entry) {
  const logs = readJson(SYNC_LOGS_PATH, []);
  logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
    created_at: new Date().toISOString(),
  });
  writeJson(SYNC_LOGS_PATH, logs);
}

// ── Create Module ──

export async function createModule({ endpoint_id, display_name, business_config = {} }) {
  const existing = Object.values(getAllModules()).find(m => m.endpoint_id === endpoint_id);
  if (existing) {
    return { success: false, error: "Module with this endpoint already exists", module: existing };
  }

  const moduleId = display_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const now = new Date().toISOString();

  const moduleData = {
    module_id: moduleId,
    display_name,
    endpoint_id,
    provider: "fal.ai",
    fal_metadata: {
      display_name: "",
      category: "",
      description: "",
      tags: [],
      status: "active",
      thumbnail_url: "",
      model_url: "",
      updated_at: "",
    },
    fal_schema: {
      input_schema: {},
      fields: [],
      required_fields: [],
      options: {},
      schema_hash: "",
      last_synced_at: "",
    },
    fal_pricing: {
      unit_price: null,
      unit: null,
      currency: "USD",
      pricing_unavailable: false,
      price_hash: "",
      last_synced_at: "",
    },
    credit_pricing: {
      credit_pack_price_usd: 10,
      credit_pack_credits: 1000,
      credit_usd_value: 0.01,
      markup_multiplier: 2.0,
      minimum_credits: 1,
      estimated_credits: null,
      last_calculated_at: "",
    },
    business_config: {
      enabled: true,
      custom_category: "",
      business_presets: {},
      prompt_presets: {},
      ui_order: 0,
      admin_notes: "",
      ...business_config,
    },
    created_at: now,
    updated_at: now,
  };

  saveModuleRaw(moduleId, moduleData);
  return { success: true, module: moduleData };
}

// ── Sync Schema from fal.ai ──

export async function syncModuleSchema(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return { success: false, error: "Module not found" };

  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return { success: false, error: "FAL key missing" };
  }

  try {
    const url = `https://api.fal.ai/v1/models?endpoint_id=${encodeURIComponent(mod.endpoint_id)}&expand=openapi-3.0`;
    const res = await fetch(url, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });

    if (!res.ok) {
      addSyncLog({ module_id: moduleId, endpoint_id: mod.endpoint_id, sync_type: "schema", status: "failed", error: `fal.ai returned ${res.status}` });
      return { success: false, error: `fal.ai returned ${res.status}` };
    }

    const data = await res.json();

    const meta = {
      display_name: data.display_name || mod.display_name,
      category: data.category || "",
      description: data.description || "",
      tags: data.tags || [],
      status: data.status || "active",
      thumbnail_url: data.thumbnail_url || "",
      model_url: data.model_url || "",
      updated_at: data.updated_at || new Date().toISOString(),
    };

    const schemaResult = parseFalSchema(data.openapi || data);
    const newHash = generateSchemaHash(schemaResult.input_schema);
    const oldHash = mod.fal_schema?.schema_hash || "";
    const changed = newHash !== oldHash;

    const updated = {
      ...mod,
      fal_metadata: meta,
      fal_schema: {
        input_schema: schemaResult.input_schema,
        fields: schemaResult.fields,
        required_fields: schemaResult.required_fields,
        options: buildOptionsMap(schemaResult.fields),
        schema_hash: newHash,
        last_synced_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    saveModuleRaw(moduleId, updated);

    addSyncLog({
      module_id: moduleId,
      endpoint_id: mod.endpoint_id,
      sync_type: "schema",
      status: changed ? "changed" : "unchanged",
      old_hash: oldHash || null,
      new_hash: newHash,
    });

    return { success: true, changed, module: getModule(moduleId) };
  } catch (err) {
    addSyncLog({ module_id: moduleId, endpoint_id: mod.endpoint_id, sync_type: "schema", status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

// ── Sync Pricing from fal.ai ──

export async function syncModulePricing(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return { success: false, error: "Module not found" };

  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return { success: false, error: "FAL key missing" };
  }

  try {
    const url = `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(mod.endpoint_id)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });

    if (!res.ok) {
      addSyncLog({ module_id: moduleId, endpoint_id: mod.endpoint_id, sync_type: "pricing", status: "failed", error: `fal.ai returned ${res.status}` });
      return { success: false, error: `fal.ai returned ${res.status}` };
    }

    const data = await res.json();
    const price = data.prices?.[0];

    const newPricing = price && price.unit_price != null
      ? { unit_price: price.unit_price, unit: price.unit, currency: price.currency || "USD", pricing_unavailable: false }
      : { unit_price: null, unit: null, currency: "USD", pricing_unavailable: true };

    const now = new Date().toISOString();
    newPricing.last_synced_at = now;
    newPricing.price_hash = generatePriceHash(newPricing.unit_price, newPricing.unit, newPricing.currency);

    const oldHash = mod.fal_pricing?.price_hash || "";
    const changed = newPricing.price_hash !== oldHash;

    const updated = {
      ...mod,
      fal_pricing: newPricing,
      updated_at: now,
    };

    saveModuleRaw(moduleId, updated);

    addSyncLog({
      module_id: moduleId,
      endpoint_id: mod.endpoint_id,
      sync_type: "pricing",
      status: changed ? "changed" : "unchanged",
      old_hash: oldHash || null,
      new_hash: newPricing.price_hash,
    });

    if (changed) {
      await calculateModuleCredits(moduleId);
    }

    return { success: true, changed, module: getModule(moduleId) };
  } catch (err) {
    addSyncLog({ module_id: moduleId, endpoint_id: mod.endpoint_id, sync_type: "pricing", status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

// ── Full Sync ──

export async function syncModule(moduleId) {
  const schemaResult = await syncModuleSchema(moduleId);
  if (!schemaResult.success) return schemaResult;

  const pricingResult = await syncModulePricing(moduleId);
  if (!pricingResult.success) return pricingResult;

  const creditsResult = await calculateModuleCredits(moduleId);

  return { success: true, schema_changed: schemaResult.changed, price_changed: pricingResult.changed, module: getModule(moduleId) };
}

// ── Calculate Credits ──

export async function calculateModuleCredits(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return { success: false, error: "Module not found" };

  const settings = getCreditSettings();
  const pricing = mod.fal_pricing;

  if (!pricing || pricing.pricing_unavailable || pricing.unit_price == null) {
    const updated = {
      ...mod,
      credit_pricing: {
        ...mod.credit_pricing,
        credit_pack_price_usd: settings.credit_pack_price_usd,
        credit_pack_credits: settings.credit_pack_credits,
        credit_usd_value: settings.credit_usd_value,
        markup_multiplier: mod.credit_pricing?.markup_multiplier || settings.default_markup_multiplier,
        minimum_credits: mod.credit_pricing?.minimum_credits || settings.minimum_generation_credits,
        estimated_credits: null,
        last_calculated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
    saveModuleRaw(moduleId, updated);
    return { success: true, credits_required: null, pricing_unavailable: true };
  }

  const markup = mod.credit_pricing?.markup_multiplier || settings.default_markup_multiplier;
  const minCredits = mod.credit_pricing?.minimum_credits || settings.minimum_generation_credits;
  const unit_price = pricing.unit_price;
  const quantity = 1;
  const provider_cost_usd = unit_price * quantity;
  const sell_cost_usd = provider_cost_usd * markup;
  let credits_required = Math.ceil(sell_cost_usd / settings.credit_usd_value);

  if (credits_required < minCredits) credits_required = minCredits;

  const updated = {
    ...mod,
    credit_pricing: {
      credit_pack_price_usd: settings.credit_pack_price_usd,
      credit_pack_credits: settings.credit_pack_credits,
      credit_usd_value: settings.credit_usd_value,
      markup_multiplier: markup,
      minimum_credits: minCredits,
      estimated_credits: credits_required,
      last_calculated_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  saveModuleRaw(moduleId, updated);
  return { success: true, credits_required, pricing_unavailable: false };
}

// ── Sync All ──

export async function syncAllModules() {
  const all = getAllModules();
  const entries = Object.entries(all);
  let schema_changed = 0;
  let price_changed = 0;
  let failed = 0;

  for (const [moduleId] of entries) {
    try {
      const schemaResult = await syncModuleSchema(moduleId);
      if (schemaResult.changed) schema_changed++;

      const pricingResult = await syncModulePricing(moduleId);
      if (pricingResult.changed) price_changed++;
    } catch {
      failed++;
    }
  }

  return { modules_checked: entries.length, schema_changed, price_changed, failed };
}

// ── Estimate Credits ──

export function estimateModuleCredits(moduleId, input = {}) {
  const mod = getModule(moduleId);
  if (!mod) return { credits_required: null, pricing_unavailable: true, error: "Module not found" };

  const pricing = mod.fal_pricing;
  if (!pricing || pricing.pricing_unavailable || pricing.unit_price == null) {
    return { credits_required: null, pricing_unavailable: true, error: "Pricing unavailable" };
  }

  const settings = getCreditSettings();
  const unit = pricing.unit || "";
  const markup = mod.credit_pricing?.markup_multiplier || settings.default_markup_multiplier;
  const minCredits = mod.credit_pricing?.minimum_credits || settings.minimum_generation_credits;

  let quantity = 1;
  let estimate_uncertain = false;

  const u = unit.toLowerCase();
  if (u === "image") {
    quantity = input.num_images || 1;
  } else if (u === "video") {
    quantity = 1;
  } else if (u.includes("second")) {
    quantity = input.duration || input.duration_seconds || 1;
  } else if (u.includes("minute")) {
    const sec = input.duration || input.duration_seconds || 60;
    quantity = Math.ceil(sec / 60);
  } else {
    estimate_uncertain = true;
  }

  if (quantity <= 0) quantity = 1;

  const provider_cost_usd = pricing.unit_price * quantity;
  const sell_cost_usd = provider_cost_usd * markup;
  let credits_required = Math.ceil(sell_cost_usd / settings.credit_usd_value);
  if (credits_required < minCredits) credits_required = minCredits;

  return {
    credits_required,
    provider_cost_usd: Math.round(provider_cost_usd * 100000) / 100000,
    sell_cost_usd: Math.round(sell_cost_usd * 100000) / 100000,
    unit: pricing.unit,
    quantity,
    estimate_uncertain,
    credit_pack: `$${settings.credit_pack_price_usd} = ${settings.credit_pack_credits} credits`,
  };
}

// ── Update Business Config ──

export function updateModuleBusinessConfig(moduleId, updates) {
  const mod = getModule(moduleId);
  if (!mod) return null;

  const allowed = ["display_name", "enabled", "custom_category", "business_presets", "prompt_presets", "ui_order", "admin_notes"];
  const business_updates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === "display_name") {
        mod.display_name = updates[key];
      } else if (key === "enabled") {
        business_updates.enabled = updates[key];
      } else {
        business_updates[key] = updates[key];
      }
    }
  }

  mod.business_config = { ...mod.business_config, ...business_updates };
  mod.updated_at = new Date().toISOString();
  saveModuleRaw(moduleId, mod);

  // Recalculate credits if markup or minimum changed
  if (updates.markup_multiplier !== undefined || updates.minimum_credits !== undefined) {
    calculateModuleCredits(moduleId);
  }

  return getModule(moduleId);
}

// ── Validate Module Against Schema ──

export function validateModuleInput(moduleId, input) {
  const mod = getModule(moduleId);
  if (!mod) return { valid: false, errors: ["Module not found"] };

  const fields = mod.fal_schema?.fields || [];
  const required = mod.fal_schema?.required_fields || [];
  const errors = [];

  for (const req of required) {
    if (input[req] === undefined || input[req] === null || input[req] === "") {
      errors.push(`Missing required field: ${req}`);
    }
  }

  for (const field of fields) {
    const val = input[field.name];
    if (val === undefined || val === null) continue;

    if (field.type === "number") {
      if (field.constraints?.minimum != null && val < field.constraints.minimum) {
        errors.push(`${field.name}: minimum is ${field.constraints.minimum}`);
      }
      if (field.constraints?.maximum != null && val > field.constraints.maximum) {
        errors.push(`${field.name}: maximum is ${field.constraints.maximum}`);
      }
    }

    if (field.type === "select" && field.options?.length > 0) {
      const validValues = field.options.map(o => o.value);
      if (!validValues.includes(val)) {
        errors.push(`${field.name}: invalid value "${val}". Allowed: ${validValues.join(", ")}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Helper ──

function buildOptionsMap(fields) {
  const map = {};
  for (const f of fields) {
    if (f.type === "select" && f.options) {
      map[f.name] = f.options;
    }
  }
  return map;
}
