import { get, query, run } from "./db";

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- Affiliate Profile ---

export async function getAffiliateByUserId(userId) {
  return await get("SELECT * FROM affiliates WHERE user_id = ?", [userId]);
}

export async function getAffiliateByCode(code) {
  return await get("SELECT * FROM affiliates WHERE code = ?", [code]);
}

export async function createAffiliate({ user_id, name, email, code, commission_rate = 30 }) {
  const existing = await getAffiliateByUserId(user_id);
  if (existing) return existing;
  const existingByCode = await getAffiliateByCode(code);
  if (existingByCode) return existingByCode;
  const id = makeId("aff");
  const link = `https://viralstudio.ai/ref/${code}`;
  await run(
    "INSERT INTO affiliates (id, user_id, name, email, code, link, commission_rate, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))",
    [id, user_id, name, email, code, link, commission_rate]
  );
  return { id, user_id, name, email, code, link, commission_rate, total_clicks: 0, total_signups: 0, total_paid_customers: 0, total_earnings: 0, total_pending: 0, total_paid: 0, status: "active", created_at: new Date().toISOString() };
}

export async function getOrCreateAffiliate({ user_id, name, email }) {
  const existing = await getAffiliateByUserId(user_id);
  if (existing) return existing;
  const username = email.split("@")[0];
  const code = `${username.toUpperCase()}20`;
  return await createAffiliate({ user_id, name, email, code });
}

export async function getAllAffiliates() {
  return await query("SELECT * FROM affiliates ORDER BY created_at DESC");
}

export async function updateAffiliate(id, updates) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = ?`);
    values.push(val);
  }
  if (fields.length === 0) return null;
  values.push(id);
  await run(`UPDATE affiliates SET ${fields.join(", ")} WHERE id = ?`, values);
  return await get("SELECT * FROM affiliates WHERE id = ?", [id]);
}

// --- Clicks Tracking ---

export async function recordClick({ affiliate_code, ip, user_agent, referrer }) {
  const id = makeId("clk");
  await run(
    "INSERT INTO clicks (id, affiliate_code, ip, user_agent, referrer, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [id, affiliate_code, ip || "", user_agent || "", referrer || ""]
  );
  await run("UPDATE affiliates SET total_clicks = COALESCE(total_clicks, 0) + 1 WHERE code = ?", [affiliate_code]);
  return { id, affiliate_code, ip, user_agent, referrer, created_at: new Date().toISOString() };
}

export async function getClicksForAffiliate(affiliateCode, limit = 50) {
  return await query("SELECT * FROM clicks WHERE affiliate_code = ? ORDER BY created_at DESC LIMIT ?", [affiliateCode, limit]);
}

// --- Referrals ---

export async function createReferral({ affiliate_code, affiliate_user_id, referred_email }) {
  const existing = await get("SELECT * FROM referrals WHERE referred_email = ? AND affiliate_code = ?", [referred_email, affiliate_code]);
  if (existing) return existing;
  const id = makeId("ref");
  await run(
    "INSERT INTO referrals (id, affiliate_code, affiliate_user_id, referred_email, status, created_at) VALUES (?, ?, ?, ?, 'signup', datetime('now'))",
    [id, affiliate_code, affiliate_user_id, referred_email]
  );
  await run("UPDATE affiliates SET total_signups = COALESCE(total_signups, 0) + 1 WHERE code = ?", [affiliate_code]);
  return { id, affiliate_code, affiliate_user_id, referred_email, plan: null, amount: 0, commission_earned: 0, commission_rate: 30, status: "signup", created_at: new Date().toISOString(), paid_at: null };
}

export async function getReferralsForAffiliate(affiliateCode) {
  return await query("SELECT * FROM referrals WHERE affiliate_code = ? ORDER BY created_at DESC", [affiliateCode]);
}

export async function getReferralByEmail(email) {
  return await get("SELECT * FROM referrals WHERE referred_email = ?", [email]);
}

export async function processReferralCommission({ referred_email, plan, amount, commission_rate }) {
  const referral = await get("SELECT * FROM referrals WHERE referred_email = ?", [referred_email]);
  if (!referral) return null;
  const commission = Math.round((amount * commission_rate) / 100 * 100) / 100;
  await run(
    "UPDATE referrals SET plan = ?, amount = ?, commission_earned = ?, commission_rate = ?, status = 'pending' WHERE referred_email = ?",
    [plan, amount, commission, commission_rate, referred_email]
  );
  await run(
    "UPDATE affiliates SET total_paid_customers = COALESCE(total_paid_customers, 0) + 1, total_earnings = COALESCE(total_earnings, 0) + ?, total_pending = COALESCE(total_pending, 0) + ? WHERE code = ?",
    [commission, commission, referral.affiliate_code]
  );
  return { ...referral, plan, amount, commission_earned: commission, commission_rate, status: "pending" };
}

export async function processCommissionForPayment(payerEmail, planId, amount) {
  const referral = await getReferralByEmail(payerEmail);
  if (!referral || referral.status !== "signup") return null;
  const affiliate = await getAffiliateByCode(referral.affiliate_code);
  if (!affiliate) return null;
  return await processReferralCommission({ referred_email: payerEmail, plan: planId, amount, commission_rate: affiliate.commission_rate || 30 });
}

// --- Withdrawals ---

export async function createWithdrawal({ affiliate_user_id, affiliate_code, amount, method, account_details }) {
  const aff = await getAffiliateByCode(affiliate_code);
  if (!aff) return null;
  if (amount > (aff.total_pending || 0)) return null;
  const id = makeId("wd");
  await run(
    "INSERT INTO withdrawals (id, affiliate_user_id, affiliate_code, amount, method, account_details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))",
    [id, affiliate_user_id, affiliate_code, amount, method, account_details || ""]
  );
  await run("UPDATE affiliates SET total_pending = MAX(0, COALESCE(total_pending, 0) - ?) WHERE code = ?", [amount, affiliate_code]);
  return { id, affiliate_user_id, affiliate_code, amount, method, account_details: account_details || "", status: "pending", created_at: new Date().toISOString(), processed_at: null };
}

export async function getWithdrawalsForAffiliate(affiliateCode) {
  return await query("SELECT * FROM withdrawals WHERE affiliate_code = ? ORDER BY created_at DESC", [affiliateCode]);
}

export async function getAllWithdrawals() {
  return await query("SELECT * FROM withdrawals ORDER BY created_at DESC");
}

export async function updateWithdrawal(id, updates) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = ?`);
    values.push(val);
  }
  if (updates.status === "completed") {
    fields.push("processed_at = datetime('now')");
  }
  if (fields.length === 0) return null;
  values.push(id);
  await run(`UPDATE withdrawals SET ${fields.join(", ")} WHERE id = ?`, values);
  if (updates.status === "completed") {
    const wd = await get("SELECT * FROM withdrawals WHERE id = ?", [id]);
    if (wd) {
      await run("UPDATE affiliates SET total_paid = COALESCE(total_paid, 0) + ? WHERE code = ?", [wd.amount, wd.affiliate_code]);
    }
  }
  return await get("SELECT * FROM withdrawals WHERE id = ?", [id]);
}
