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
  const raw = rawPayload ? JSON.stringify(rawPayload) : null;
  await run(
    "INSERT INTO transactions (id, user_id, provider, plan_id, billing_cycle, amount, currency, credits, status, provider_payment_id, raw_payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
    [id, userId, provider, planId, billingCycle, amount, currency, credits, status, providerPaymentId, raw]
  );
  return { id, user_id: userId, provider, plan_id: planId, billing_cycle: billingCycle, amount, currency, credits, status, provider_payment_id: providerPaymentId, raw_payload: rawPayload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export async function getTransaction(id) {
  const row = await get("SELECT * FROM transactions WHERE id = ?", [id]);
  if (!row) return null;
  if (row.raw_payload) try { row.raw_payload = JSON.parse(row.raw_payload); } catch {}
  return row;
}

export async function getTransactionByProviderId(provider, providerPaymentId) {
  const row = await get("SELECT * FROM transactions WHERE provider = ? AND provider_payment_id = ?", [provider, providerPaymentId]);
  if (!row) return null;
  if (row.raw_payload) try { row.raw_payload = JSON.parse(row.raw_payload); } catch {}
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
  await run(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`, values);
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
