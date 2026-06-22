import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const TRANSACTIONS_PATH = path.join(DATA_DIR, "payment-transactions.json");
const LEDGER_PATH = path.join(DATA_DIR, "credit-ledger.json");

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

export const PLANS = {
  starter: { name: "Starter", monthly: 18, creditsPerMonth: 500 },
  professional: { name: "Professional", monthly: 25, creditsPerMonth: 1000 },
  team: { name: "Team", monthly: 83, creditsPerMonth: 5000 },
};

export const DISCOUNT = 0.30;

export function getPlanPrice(planId, annual) {
  const plan = PLANS[planId];
  if (!plan) return null;
  if (annual) return Math.round(plan.monthly * 12 * (1 - DISCOUNT));
  return plan.monthly;
}

export function getPlanCredits(planId, annual) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  if (annual) return Math.round(plan.creditsPerMonth * 12 * (1 + DISCOUNT));
  return plan.creditsPerMonth;
}

export function getPlanYearlyCredits(planId) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  return plan.creditsPerMonth * 12;
}

export function createTransaction({ userId, provider, planId, billingCycle, amount, currency = "USD", credits, status = "pending", providerPaymentId = null, rawPayload = null }) {
  const txs = readJson(TRANSACTIONS_PATH, []);
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    user_id: userId,
    provider,
    plan_id: planId,
    billing_cycle: billingCycle,
    amount,
    currency,
    credits,
    status,
    provider_payment_id: providerPaymentId,
    raw_payload: rawPayload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  txs.push(tx);
  writeJson(TRANSACTIONS_PATH, txs);
  return tx;
}

export function getTransaction(id) {
  const txs = readJson(TRANSACTIONS_PATH, []);
  return txs.find((t) => t.id === id) || null;
}

export function getTransactionByProviderId(provider, providerPaymentId) {
  const txs = readJson(TRANSACTIONS_PATH, []);
  return txs.find((t) => t.provider === provider && t.provider_payment_id === providerPaymentId) || null;
}

export function updateTransaction(id, updates) {
  const txs = readJson(TRANSACTIONS_PATH, []);
  const idx = txs.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  txs[idx] = { ...txs[idx], ...updates, updated_at: new Date().toISOString() };
  writeJson(TRANSACTIONS_PATH, txs);
  return txs[idx];
}

export function addCreditLedgerEntry({ userId, transactionId, creditsAdded, reason }) {
  const entries = readJson(LEDGER_PATH, []);
  // Idempotency: skip if same transaction already processed
  if (entries.find((e) => e.transaction_id === transactionId)) return null;
  const entry = {
    id: `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    user_id: userId,
    transaction_id: transactionId,
    credits_added: creditsAdded,
    reason,
    created_at: new Date().toISOString(),
  };
  entries.push(entry);
  writeJson(LEDGER_PATH, entries);
  return entry;
}

export function getLedgerEntries(userId) {
  const entries = readJson(LEDGER_PATH, []);
  return entries.filter((e) => e.user_id === userId);
}

export function isTransactionProcessed(transactionId) {
  const entries = readJson(LEDGER_PATH, []);
  return entries.some((e) => e.transaction_id === transactionId);
}
