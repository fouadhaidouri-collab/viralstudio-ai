import { get, query, run } from "./db";
import { getFalKey } from "./fal-key";

export async function getCreditSettings() {
  const row = await get("SELECT * FROM credit_settings WHERE key = 'main'");
  if (row) return JSON.parse(row.value);
  return {
    id: "default",
    credit_pack_price_usd: 29,
    credit_pack_credits: 1000,
    credit_usd_value: 0.029,
    default_markup_multiplier: 2.0,
    minimum_generation_credits: 1,
  };
}

export async function saveCreditSettings(updates) {
  const current = await getCreditSettings();
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  await run("INSERT OR REPLACE INTO credit_settings (key, value) VALUES ('main', ?)", [JSON.stringify(updated)]);
  return updated;
}

export async function getProviderPrices() {
  const rows = await query("SELECT * FROM provider_model_prices");
  const map = {};
  for (const r of rows) map[r.id] = r;
  return map;
}

export async function getModuleCreditPrices() {
  const rows = await query("SELECT * FROM module_credit_prices");
  const map = {};
  for (const r of rows) map[r.module_id] = r;
  return map;
}

export async function saveProviderPrice(record) {
  await run(
    "INSERT OR REPLACE INTO provider_model_prices (id, provider, model_id, price, currency, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [record.endpoint_id, "fal", record.endpoint_id, record.unit_price || 0, record.currency || "USD"]
  );
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
  if (unit === "image") return { quantity: input.num_images || 1, estimate_uncertain: false };
  if (unit === "video") return { quantity: 1, estimate_uncertain: false };
  if (unit.includes("second")) return { quantity: input.duration || input.duration_seconds || 1, estimate_uncertain: false };
  if (unit.includes("minute")) {
    const sec = input.duration || input.duration_seconds || 60;
    return { quantity: Math.ceil(sec / 60), estimate_uncertain: false };
  }
  return { quantity: 1, estimate_uncertain: true };
}

export function calculateCreditsRequired({
  unit_price, unit, quantity = 1, credit_usd_value = 0.029, markup_multiplier = 2.0, minimum_generation_credits = 1,
}) {
  if (unit_price == null) {
    return { provider_cost_usd: null, sell_cost_usd: null, credits_required: null, pricing_unavailable: true, unit, quantity };
  }
  const provider_cost_usd = unit_price * quantity;
  const sell_cost_usd = provider_cost_usd * markup_multiplier;
  let credits_required = Math.ceil(sell_cost_usd / credit_usd_value);
  if (credits_required < minimum_generation_credits) credits_required = minimum_generation_credits;
  return {
    provider_cost_usd: Math.round(provider_cost_usd * 100000) / 100000,
    sell_cost_usd: Math.round(sell_cost_usd * 100000) / 100000,
    credits_required,
    pricing_unavailable: false,
    unit, quantity,
  };
}

export async function recalculateModuleCreditPrice(moduleId, endpointId, providerRecord, settings) {
  const s = settings || (await getCreditSettings());
  if (!providerRecord || providerRecord.pricing_unavailable) {
    return { module_id: moduleId, endpoint_id: endpointId, unit_price: providerRecord?.unit_price ?? null, unit: providerRecord?.unit ?? null, provider_cost_usd: null, markup_multiplier: s.default_markup_multiplier, credit_usd_value: s.credit_usd_value, credits_required: null, pricing_unavailable: true, last_calculated_at: new Date().toISOString() };
  }
  const result = calculateCreditsRequired({ unit_price: providerRecord.unit_price, unit: providerRecord.unit, quantity: 1, credit_usd_value: s.credit_usd_value, markup_multiplier: s.default_markup_multiplier, minimum_generation_credits: s.minimum_generation_credits });
  return { module_id: moduleId, endpoint_id: endpointId, unit_price: providerRecord.unit_price, unit: providerRecord.unit, provider_cost_usd: result.provider_cost_usd, markup_multiplier: s.default_markup_multiplier, credit_usd_value: s.credit_usd_value, credits_required: result.credits_required, pricing_unavailable: false, last_calculated_at: new Date().toISOString() };
}

export async function saveModuleCreditPrice(record) {
  await run(
    "INSERT OR REPLACE INTO module_credit_prices (module_id, endpoint_id, credits_per_generation, unit_price, unit, provider_cost_usd, markup_multiplier, credit_usd_value, pricing_unavailable, last_calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    [record.module_id, record.endpoint_id || "", record.credits_required || 0, record.unit_price || null, record.unit || null, record.provider_cost_usd || null, record.markup_multiplier || 2.0, record.credit_usd_value || 0.029, record.pricing_unavailable ? 1 : 0]
  );
}

export async function syncAllModulePrices(modules) {
  const settings = await getCreditSettings();
  let synced = 0, failed = 0, pricing_unavailable = 0;
  for (const mod of modules) {
    const endpointId = mod.fal_model;
    if (!endpointId) continue;
    const providerResult = await fetchFalModelPricing(endpointId);
    if (providerResult.success) {
      await saveProviderPrice(providerResult);
      if (providerResult.pricing_unavailable) pricing_unavailable++;
      else synced++;
      const creditRecord = await recalculateModuleCreditPrice(mod.label, endpointId, providerResult, settings);
      await saveModuleCreditPrice(creditRecord);
    } else failed++;
  }
  return { synced, failed, pricing_unavailable, total: modules.length };
}

export async function getModuleCreditPrice(moduleId) {
  return await get("SELECT * FROM module_credit_prices WHERE module_id = ?", [moduleId]);
}

export async function estimateGenerationCredits(moduleId, input) {
  const settings = await getCreditSettings();
  const modulePrice = await getModuleCreditPrice(moduleId);
  if (!modulePrice) return { credits_required: null, pricing_unavailable: true, error: "Module not synced" };
  if (modulePrice.pricing_unavailable) return { credits_required: null, pricing_unavailable: true, error: "Pricing unavailable for this module" };
  const billing = calculateBillingQuantity(moduleId, input, modulePrice.unit);
  if (billing.quantity <= 0) billing.quantity = 1;
  const result = calculateCreditsRequired({ unit_price: modulePrice.unit_price, unit: modulePrice.unit, quantity: billing.quantity, credit_usd_value: settings.credit_usd_value, markup_multiplier: modulePrice.markup_multiplier || settings.default_markup_multiplier, minimum_generation_credits: settings.minimum_generation_credits });
  return { credits_required: result.credits_required, provider_cost_usd: result.provider_cost_usd, sell_cost_usd: result.sell_cost_usd, unit: result.unit, quantity: billing.quantity, estimate_uncertain: billing.estimate_uncertain, credit_pack: `$${settings.credit_pack_price_usd} = ${settings.credit_pack_credits} credits` };
}

export async function getUserCredits(userId) {
  const row = await get("SELECT * FROM user_credits WHERE user_id = ?", [userId]);
  if (row) return { user_id: row.user_id, balance_credits: row.credits || 0, updated_at: null };
  return { user_id: userId, balance_credits: 0, updated_at: null };
}

export async function saveUserCredits(userId, balance) {
  await run(
    "INSERT OR REPLACE INTO user_credits (user_id, credits, total_purchased, total_used, updated_at) VALUES (?, ?, COALESCE((SELECT total_purchased FROM user_credits WHERE user_id = ?), 0), COALESCE((SELECT total_used FROM user_credits WHERE user_id = ?), 0), datetime('now'))",
    [userId, balance, userId, userId]
  );
}

export async function addUserCredits(userId, amount, type = "purchase", metadata = {}) {
  const user = await getUserCredits(userId);
  const newBalance = (user.balance_credits || 0) + amount;
  await run(
    "INSERT OR REPLACE INTO user_credits (user_id, credits, total_purchased, total_used) VALUES (?, ?, COALESCE((SELECT total_purchased FROM user_credits WHERE user_id = ?), 0) + ?, COALESCE((SELECT total_used FROM user_credits WHERE user_id = ?), 0), datetime('now'))",
    [userId, newBalance, userId, amount, userId]
  );
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId, type, amount_credits: amount, metadata, created_at: new Date().toISOString(),
  };
  return { balance: newBalance, transaction: tx };
}

export async function deductUserCredits(userId, amount, moduleId, endpointId, metadata = {}) {
  const user = await getUserCredits(userId);
  if ((user.balance_credits || 0) < amount) {
    return { success: false, error: "Not enough credits", balance: user.balance_credits };
  }
  const newBalance = user.balance_credits - amount;
  await run(
    "INSERT OR REPLACE INTO user_credits (user_id, credits, total_purchased, total_used) VALUES (?, ?, COALESCE((SELECT total_purchased FROM user_credits WHERE user_id = ?), 0), COALESCE((SELECT total_used FROM user_credits WHERE user_id = ?), 0) + ?, datetime('now'))",
    [userId, newBalance, userId, userId, amount]
  );
  const tx = { id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, user_id: userId, type: "generation", amount_credits: -amount, module_id: moduleId, endpoint_id: endpointId, metadata, created_at: new Date().toISOString() };
  return { success: true, balance: newBalance, transaction: tx };
}

export async function refundUserCredits(userId, originalTx, metadata = {}) {
  const amount = Math.abs(originalTx.amount_credits || 0);
  return await addUserCredits(userId, amount, "refund", { ...metadata, refunds_tx_id: originalTx.id });
}
