import fs from "fs";
import path from "path";
import { getFalKey } from "./fal-key";

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const SETTINGS_PATH = path.join(DATA_DIR, "credit-settings.json");
const PROVIDER_PRICES_PATH = path.join(DATA_DIR, "provider-model-prices.json");
const MODULE_CREDIT_PATH = path.join(DATA_DIR, "module-credit-prices.json");
const USER_CREDITS_PATH = path.join(DATA_DIR, "user-credits.json");
const TRANSACTIONS_PATH = path.join(DATA_DIR, "credit-transactions.json");

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

export function getCreditSettings() {
  return readJson(SETTINGS_PATH, {
    id: "default",
    credit_pack_price_usd: 29,
    credit_pack_credits: 1000,
    credit_usd_value: 0.029,
    default_markup_multiplier: 2.0,
    minimum_generation_credits: 1,
  });
}

export function saveCreditSettings(updates) {
  const current = getCreditSettings();
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  writeJson(SETTINGS_PATH, updated);
  return updated;
}

export function getProviderPrices() {
  return readJson(PROVIDER_PRICES_PATH, {});
}

export function getModuleCreditPrices() {
  return readJson(MODULE_CREDIT_PATH, {});
}

export function saveProviderPrice(record) {
  const all = getProviderPrices();
  all[record.endpoint_id] = { ...record, updated_at: new Date().toISOString() };
  writeJson(PROVIDER_PRICES_PATH, all);
}

export async function fetchFalModelPricing(endpointId) {
  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return { success: false, error: "FAL key missing" };
  }

  try {
    const url = `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(endpointId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });

    if (!res.ok) {
      return { success: false, error: `fal.ai returned ${res.status}` };
    }

    const data = await res.json();
    const price = data.prices?.[0];

    if (price && price.unit_price != null) {
      return {
        success: true,
        endpoint_id: endpointId,
        unit_price: price.unit_price,
        unit: price.unit,
        currency: price.currency || "USD",
        pricing_unavailable: false,
        raw_response: data,
        last_synced_at: new Date().toISOString(),
      };
    }

    return {
      success: true,
      endpoint_id: endpointId,
      unit_price: null,
      unit: null,
      currency: "USD",
      pricing_unavailable: true,
      raw_response: data,
      last_synced_at: new Date().toISOString(),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function calculateBillingQuantity(moduleType, input, providerUnit) {
  if (!providerUnit) return { quantity: 1, estimate_uncertain: true };

  const unit = providerUnit.toLowerCase();

  if (unit === "image") {
    return { quantity: input.num_images || 1, estimate_uncertain: false };
  }

  if (unit === "video") {
    return { quantity: 1, estimate_uncertain: false };
  }

  if (unit.includes("second")) {
    return { quantity: input.duration || input.duration_seconds || 1, estimate_uncertain: false };
  }

  if (unit.includes("minute")) {
    const sec = input.duration || input.duration_seconds || 60;
    return { quantity: Math.ceil(sec / 60), estimate_uncertain: false };
  }

  return { quantity: 1, estimate_uncertain: true };
}

export function calculateCreditsRequired({
  unit_price,
  unit,
  quantity = 1,
  credit_usd_value = 0.029,
  markup_multiplier = 2.0,
  minimum_generation_credits = 1,
}) {
  if (unit_price == null) {
    return {
      provider_cost_usd: null,
      sell_cost_usd: null,
      credits_required: null,
      pricing_unavailable: true,
      unit,
      quantity,
    };
  }

  const provider_cost_usd = unit_price * quantity;
  const sell_cost_usd = provider_cost_usd * markup_multiplier;
  let credits_required = Math.ceil(sell_cost_usd / credit_usd_value);

  if (credits_required < minimum_generation_credits) {
    credits_required = minimum_generation_credits;
  }

  return {
    provider_cost_usd: Math.round(provider_cost_usd * 100000) / 100000,
    sell_cost_usd: Math.round(sell_cost_usd * 100000) / 100000,
    credits_required,
    pricing_unavailable: false,
    unit,
    quantity,
  };
}

export function recalculateModuleCreditPrice(moduleId, endpointId, providerRecord, settings) {
  const s = settings || getCreditSettings();

  if (!providerRecord || providerRecord.pricing_unavailable) {
    const record = {
      module_id: moduleId,
      endpoint_id: endpointId,
      unit_price: providerRecord?.unit_price ?? null,
      unit: providerRecord?.unit ?? null,
      provider_cost_usd: null,
      markup_multiplier: s.default_markup_multiplier,
      credit_usd_value: s.credit_usd_value,
      credits_required: null,
      pricing_unavailable: true,
      last_calculated_at: new Date().toISOString(),
    };
    return record;
  }

  const result = calculateCreditsRequired({
    unit_price: providerRecord.unit_price,
    unit: providerRecord.unit,
    quantity: 1,
    credit_usd_value: s.credit_usd_value,
    markup_multiplier: s.default_markup_multiplier,
    minimum_generation_credits: s.minimum_generation_credits,
  });

  return {
    module_id: moduleId,
    endpoint_id: endpointId,
    unit_price: providerRecord.unit_price,
    unit: providerRecord.unit,
    provider_cost_usd: result.provider_cost_usd,
    markup_multiplier: s.default_markup_multiplier,
    credit_usd_value: s.credit_usd_value,
    credits_required: result.credits_required,
    pricing_unavailable: false,
    last_calculated_at: new Date().toISOString(),
  };
}

export function saveModuleCreditPrice(record) {
  const all = getModuleCreditPrices();
  all[record.module_id] = record;
  writeJson(MODULE_CREDIT_PATH, all);
}

export async function syncAllModulePrices(modules) {
  const settings = getCreditSettings();
  let synced = 0;
  let failed = 0;
  let pricing_unavailable = 0;

  for (const mod of modules) {
    const endpointId = mod.fal_model;
    if (!endpointId) continue;

    const providerResult = await fetchFalModelPricing(endpointId);
    if (providerResult.success) {
      saveProviderPrice(providerResult);
      if (providerResult.pricing_unavailable) {
        pricing_unavailable++;
      } else {
        synced++;
      }

      const creditRecord = recalculateModuleCreditPrice(mod.label, endpointId, providerResult, settings);
      saveModuleCreditPrice(creditRecord);
    } else {
      failed++;
    }
  }

  return { synced, failed, pricing_unavailable, total: modules.length };
}

export function getModuleCreditPrice(moduleId) {
  const all = getModuleCreditPrices();
  return all[moduleId] || null;
}

export function estimateGenerationCredits(moduleId, input) {
  const settings = getCreditSettings();
  const modulePrice = getModuleCreditPrice(moduleId);

  if (!modulePrice) {
    return { credits_required: null, pricing_unavailable: true, error: "Module not synced" };
  }

  if (modulePrice.pricing_unavailable) {
    return {
      credits_required: null,
      pricing_unavailable: true,
      error: "Pricing unavailable for this module",
    };
  }

  const billing = calculateBillingQuantity(moduleId, input, modulePrice.unit);

  if (billing.quantity <= 0) billing.quantity = 1;

  const result = calculateCreditsRequired({
    unit_price: modulePrice.unit_price,
    unit: modulePrice.unit,
    quantity: billing.quantity,
    credit_usd_value: settings.credit_usd_value,
    markup_multiplier: modulePrice.markup_multiplier || settings.default_markup_multiplier,
    minimum_generation_credits: settings.minimum_generation_credits,
  });

  return {
    credits_required: result.credits_required,
    provider_cost_usd: result.provider_cost_usd,
    sell_cost_usd: result.sell_cost_usd,
    unit: result.unit,
    quantity: billing.quantity,
    estimate_uncertain: billing.estimate_uncertain,
    credit_pack: `$${settings.credit_pack_price_usd} = ${settings.credit_pack_credits} credits`,
  };
}

export function getUserCredits(userId) {
  const all = readJson(USER_CREDITS_PATH, {});
  return all[userId] || { user_id: userId, balance_credits: 0, updated_at: null };
}

export function saveUserCredits(userId, balance) {
  const all = readJson(USER_CREDITS_PATH, {});
  all[userId] = { user_id: userId, balance_credits: balance, updated_at: new Date().toISOString() };
  writeJson(USER_CREDITS_PATH, all);
}

export function addUserCredits(userId, amount, type = "purchase", metadata = {}) {
  const user = getUserCredits(userId);
  const newBalance = (user.balance_credits || 0) + amount;
  saveUserCredits(userId, newBalance);

  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    type,
    amount_credits: amount,
    metadata,
    created_at: new Date().toISOString(),
  };
  const txs = readJson(TRANSACTIONS_PATH, []);
  txs.push(tx);
  writeJson(TRANSACTIONS_PATH, txs);

  return { balance: newBalance, transaction: tx };
}

export function deductUserCredits(userId, amount, moduleId, endpointId, metadata = {}) {
  const user = getUserCredits(userId);
  if ((user.balance_credits || 0) < amount) {
    return { success: false, error: "Not enough credits", balance: user.balance_credits };
  }

  const newBalance = user.balance_credits - amount;
  saveUserCredits(userId, newBalance);

  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    type: "generation",
    amount_credits: -amount,
    module_id: moduleId,
    endpoint_id: endpointId,
    metadata,
    created_at: new Date().toISOString(),
  };
  const txs = readJson(TRANSACTIONS_PATH, []);
  txs.push(tx);
  writeJson(TRANSACTIONS_PATH, txs);

  return { success: true, balance: newBalance, transaction: tx };
}

export function refundUserCredits(userId, originalTx, metadata = {}) {
  const amount = Math.abs(originalTx.amount_credits || 0);
  return addUserCredits(userId, amount, "refund", { ...metadata, refunds_tx_id: originalTx.id });
}
