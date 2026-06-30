import { query, get, run } from "./db";

export const PLANS = {
  micro: { name: "Micro", weekly: 9, creditsPerWeek: 306 },
  starter: { name: "Starter", monthly: 25, creditsPerMonth: 850 },
  professional: { name: "Professional", monthly: 35, creditsPerMonth: 1190 },
  team: { name: "Team", monthly: 119, creditsPerMonth: 4046 },
};

export const DISCOUNT = 0.30;

export function getPlanPrice(planId, annual) {
  const plan = PLANS[planId];
  if (!plan) return null;
  if (plan.weekly) return plan.weekly;
  if (annual) return Math.round(plan.monthly * 12 * (1 - DISCOUNT));
  return plan.monthly;
}

export function getPlanCredits(planId, annual) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  if (plan.weekly) return plan.creditsPerWeek;
  if (annual) return Math.round(plan.creditsPerMonth * 12 * (1 + DISCOUNT));
  return plan.creditsPerMonth;
}

export function getPlanYearlyCredits(planId) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  return plan.creditsPerMonth * 12;
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
