import { query, get, run } from "./db";

export const STORAGE_LIMITS = {
  beginner: 2 * 1024 * 1024 * 1024,
  builder: 5 * 1024 * 1024 * 1024,
  creator: 10 * 1024 * 1024 * 1024,
  pro: 25 * 1024 * 1024 * 1024,
  elite: 50 * 1024 * 1024 * 1024,
  ultimate: 100 * 1024 * 1024 * 1024,
};

// One-time credit packs. Base rate: $10 = 1,000 credits (1 credit = $0.01).
// `bonusPercent` is added on top of `baseCredits` to give the total granted.
export const PLANS = {
  beginner: { name: "Starter", price: 10, baseCredits: 1000, bonusPercent: 0 },
  builder: { name: "Basic", price: 25, baseCredits: 2500, bonusPercent: 5 },
  creator: { name: "Pro", price: 50, baseCredits: 5000, bonusPercent: 10 },
  pro: { name: "Business", price: 100, baseCredits: 10000, bonusPercent: 15, popular: true },
  elite: { name: "Premium", price: 200, baseCredits: 20000, bonusPercent: 20, bestValue: true },
  ultimate: { name: "Elite", price: 500, baseCredits: 50000, bonusPercent: 20 },
};

// $10 = 1,000 credits → each credit is worth $0.01.
export const CREDIT_USD_VALUE = 0.01;

export function getPlanPrice(planId) {
  const plan = PLANS[planId];
  if (!plan) return null;
  return plan.price;
}

// Total credits granted for a pack = base credits + bonus %.
export function getPlanCredits(planId) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  return Math.round(plan.baseCredits * (1 + (plan.bonusPercent || 0) / 100));
}

export function getPlanBaseCredits(planId) {
  const plan = PLANS[planId];
  return plan ? plan.baseCredits : 0;
}

export function getPlanYearlyCredits(planId) {
  return getPlanCredits(planId);
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createTransaction({ userId, provider, planId, billingCycle, amount, currency = "USD", credits, status = "pending", providerPaymentId = null, rawPayload = null }) {
  const id = makeId("tx");
  const metadata = rawPayload ? JSON.stringify(rawPayload) : null;
  await run(
    "INSERT INTO payments (id, user_id, provider, transaction_id, amount, currency, status, plan_id, billing_cycle, credits, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    [id, userId, provider, providerPaymentId, amount, currency, status, planId, billingCycle, credits || 0, metadata]
  );
  return { id, user_id: userId, provider, transaction_id: providerPaymentId, amount, currency, status, plan_id: planId, billing_cycle: billingCycle, credits, raw_payload: rawPayload, created_at: new Date().toISOString() };
}

export async function getTransaction(id) {
  const row = await get("SELECT * FROM payments WHERE id = ?", [id]);
  if (!row) return null;
  return row;
}

export async function getTransactionByProviderId(provider, providerPaymentId) {
  const row = await get("SELECT * FROM payments WHERE provider = ? AND transaction_id = ?", [provider, providerPaymentId]);
  return row;
}

export async function updateTransaction(id, updates) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = ?`);
    values.push(val !== null && typeof val === "object" ? JSON.stringify(val) : val);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await run(`UPDATE payments SET ${fields.join(", ")} WHERE id = ?`, values);
  return await getTransaction(id);
}

export async function addCreditLedgerEntry({ userId, transactionId, creditsAdded, reason }) {
  const existing = await get("SELECT * FROM credit_ledger WHERE transaction_id = ?", [transactionId]);
  if (existing) return null;
  const id = `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await run(
    "INSERT INTO credit_ledger (id, user_id, transaction_id, credits_added, reason, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [id, userId, transactionId, creditsAdded, reason]
  );
  return { id, user_id: userId, transaction_id: transactionId, credits_added: creditsAdded, reason, created_at: new Date().toISOString() };
}

export async function getLedgerEntries(userId) {
  return await query("SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

export async function isTransactionProcessed(transactionId) {
  const entry = await get("SELECT * FROM credit_ledger WHERE transaction_id = ?", [transactionId]);
  return !!entry;
}
