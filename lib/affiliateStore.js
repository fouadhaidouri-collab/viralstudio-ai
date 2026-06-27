import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const AFFILIATES_PATH = path.join(DATA_DIR, "affiliates.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb() {
  try {
    if (fs.existsSync(AFFILIATES_PATH)) {
      return JSON.parse(fs.readFileSync(AFFILIATES_PATH, "utf-8"));
    }
  } catch {}
  return { affiliates: [], clicks: [], referrals: [], withdrawals: [] };
}

function writeDb(data) {
  ensureDir();
  fs.writeFileSync(AFFILIATES_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- Affiliate Profile ---

export function getAffiliateByUserId(userId) {
  const db = readDb();
  return db.affiliates.find((a) => a.user_id === userId) || null;
}

export function getAffiliateByCode(code) {
  const db = readDb();
  return db.affiliates.find((a) => a.code === code) || null;
}

export function createAffiliate({ user_id, name, email, code, commission_rate = 30 }) {
  const db = readDb();
  if (db.affiliates.find((a) => a.user_id === user_id)) return getAffiliateByUserId(user_id);
  if (db.affiliates.find((a) => a.code === code)) return getAffiliateByCode(code);
  const affiliate = {
    id: makeId("aff"),
    user_id,
    name,
    email,
    code,
    link: `https://viralstudio.ai/ref/${code}`,
    commission_rate,
    total_clicks: 0,
    total_signups: 0,
    total_paid_customers: 0,
    total_earnings: 0,
    total_pending: 0,
    total_paid: 0,
    status: "active",
    created_at: new Date().toISOString(),
  };
  db.affiliates.push(affiliate);
  writeDb(db);
  return affiliate;
}

export function getOrCreateAffiliate({ user_id, name, email }) {
  const existing = getAffiliateByUserId(user_id);
  if (existing) return existing;
  const username = email.split("@")[0];
  const code = `${username.toUpperCase()}20`;
  return createAffiliate({ user_id, name, email, code });
}

export function getAllAffiliates() {
  const db = readDb();
  return db.affiliates;
}

export function updateAffiliate(id, updates) {
  const db = readDb();
  const idx = db.affiliates.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  db.affiliates[idx] = { ...db.affiliates[idx], ...updates };
  writeDb(db);
  return db.affiliates[idx];
}

// --- Clicks Tracking ---

export function recordClick({ affiliate_code, ip, user_agent, referrer }) {
  const db = readDb();
  const click = {
    id: makeId("clk"),
    affiliate_code,
    ip: ip || "",
    user_agent: user_agent || "",
    referrer: referrer || "",
    created_at: new Date().toISOString(),
  };
  db.clicks.push(click);
  // Update total_clicks on affiliate
  const affIdx = db.affiliates.findIndex((a) => a.code === affiliate_code);
  if (affIdx !== -1) {
    db.affiliates[affIdx].total_clicks = (db.affiliates[affIdx].total_clicks || 0) + 1;
  }
  writeDb(db);
  return click;
}

export function getClicksForAffiliate(affiliateCode, limit = 50) {
  const db = readDb();
  return db.clicks.filter((c) => c.affiliate_code === affiliateCode).slice(-limit);
}

// --- Referrals ---

export function createReferral({ affiliate_code, affiliate_user_id, referred_email }) {
  const db = readDb();
  // Avoid duplicates
  const existing = db.referrals.find((r) => r.referred_email === referred_email && r.affiliate_code === affiliate_code);
  if (existing) return existing;
  const referral = {
    id: makeId("ref"),
    affiliate_code,
    affiliate_user_id,
    referred_email,
    plan: null,
    amount: 0,
    commission_earned: 0,
    commission_rate: 30,
    status: "signup",
    created_at: new Date().toISOString(),
    paid_at: null,
  };
  db.referrals.push(referral);
  // Update total_signups on affiliate
  const affIdx = db.affiliates.findIndex((a) => a.code === affiliate_code);
  if (affIdx !== -1) {
    db.affiliates[affIdx].total_signups = (db.affiliates[affIdx].total_signups || 0) + 1;
  }
  writeDb(db);
  return referral;
}

export function getReferralsForAffiliate(affiliateCode) {
  const db = readDb();
  return db.referrals.filter((r) => r.affiliate_code === affiliateCode);
}

export function getReferralByEmail(email) {
  const db = readDb();
  return db.referrals.find((r) => r.referred_email === email) || null;
}

export function processReferralCommission({ referred_email, plan, amount, commission_rate }) {
  const db = readDb();
  const refIdx = db.referrals.findIndex((r) => r.referred_email === referred_email);
  if (refIdx === -1) return null;
  const referral = db.referrals[refIdx];
  const commission = Math.round((amount * commission_rate) / 100 * 100) / 100;
  referral.plan = plan;
  referral.amount = amount;
  referral.commission_earned = commission;
  referral.commission_rate = commission_rate;
  referral.status = "pending";
  db.referrals[refIdx] = referral;
  // Update affiliate totals
  const affIdx = db.affiliates.findIndex((a) => a.code === referral.affiliate_code);
  if (affIdx !== -1) {
    db.affiliates[affIdx].total_paid_customers = (db.affiliates[affIdx].total_paid_customers || 0) + 1;
    db.affiliates[affIdx].total_earnings = Math.round(((db.affiliates[affIdx].total_earnings || 0) + commission) * 100) / 100;
    db.affiliates[affIdx].total_pending = Math.round(((db.affiliates[affIdx].total_pending || 0) + commission) * 100) / 100;
  }
  writeDb(db);
  return referral;
}

// --- Withdrawals ---

export function processCommissionForPayment(payerEmail, planId, amount) {
  const referral = getReferralByEmail(payerEmail);
  if (!referral || referral.status !== "signup") return null;
  const affiliate = getAffiliateByCode(referral.affiliate_code);
  if (!affiliate) return null;
  return processReferralCommission({
    referred_email: payerEmail,
    plan: planId,
    amount,
    commission_rate: affiliate.commission_rate || 30,
  });
}

export function createWithdrawal({ affiliate_user_id, affiliate_code, amount, method, account_details }) {
  const db = readDb();
  const aff = db.affiliates.find((a) => a.code === affiliate_code);
  if (!aff) return null;
  if (amount > aff.total_pending) return null;
  const wd = {
    id: makeId("wd"),
    affiliate_user_id,
    affiliate_code,
    amount,
    method,
    account_details: account_details || "",
    status: "pending",
    created_at: new Date().toISOString(),
    processed_at: null,
  };
  db.withdrawals.push(wd);
  // Deduct from pending
  aff.total_pending = Math.round(((aff.total_pending || 0) - amount) * 100) / 100;
  writeDb(db);
  return wd;
}

export function getWithdrawalsForAffiliate(affiliateCode) {
  const db = readDb();
  return db.withdrawals.filter((w) => w.affiliate_code === affiliateCode);
}

export function getAllWithdrawals() {
  const db = readDb();
  return db.withdrawals;
}

export function updateWithdrawal(id, updates) {
  const db = readDb();
  const idx = db.withdrawals.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  db.withdrawals[idx] = { ...db.withdrawals[idx], ...updates, processed_at: updates.status === "completed" ? new Date().toISOString() : db.withdrawals[idx].processed_at };
  // If completed, move from pending to paid on affiliate
  if (updates.status === "completed") {
    const wd = db.withdrawals[idx];
    const affIdx = db.affiliates.findIndex((a) => a.code === wd.affiliate_code);
    if (affIdx !== -1) {
      db.affiliates[affIdx].total_paid = Math.round(((db.affiliates[affIdx].total_paid || 0) + wd.amount) * 100) / 100;
    }
  }
  writeDb(db);
  return db.withdrawals[idx];
}
