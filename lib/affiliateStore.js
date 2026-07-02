import { get, query, run } from "./db";

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- Affiliate Account ---

export async function getAffiliateByUserId(userId) {
  return await get("SELECT * FROM affiliate_accounts WHERE user_id = ?", [userId]);
}

export async function getAffiliateByCode(code) {
  return await get("SELECT * FROM affiliate_accounts WHERE referral_code = ?", [code]);
}

export async function getAffiliateById(id) {
  return await get("SELECT * FROM affiliate_accounts WHERE id = ?", [id]);
}

export async function createAffiliate({ user_id, name, email, code, commission_percent = 20 }) {
  const existing = await getAffiliateByUserId(user_id);
  if (existing) return existing;
  const existingByCode = await getAffiliateByCode(code);
  if (existingByCode) return existingByCode;
  const id = makeId("aff");
  await run(
    "INSERT INTO affiliate_accounts (id, user_id, referral_code, commission_percent, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [id, user_id, code, commission_percent]
  );
  return { id, user_id, referral_code: code, commission_percent, total_earnings: 0, available_balance: 0, paid_balance: 0, clicks: 0, signups: 0, created_at: new Date().toISOString() };
}

export async function getOrCreateAffiliate({ user_id, name, email }) {
  const existing = await getAffiliateByUserId(user_id);
  if (existing) return existing;
  const username = email.split("@")[0];
  const code = `${username.toUpperCase()}20`;
  return await createAffiliate({ user_id, name, email, code });
}

export async function getAllAffiliates() {
  return await query(
    `SELECT a.id, a.user_id, a.referral_code AS code, a.commission_percent AS commission_rate,
            a.total_earnings, a.available_balance, a.paid_balance,
            a.clicks AS total_clicks, a.signups AS total_signups,
            a.created_at, COALESCE(a.status, 'active') AS status,
            u.name, u.email,
            (SELECT COUNT(*) FROM payments p WHERE p.user_id = a.user_id AND p.status = 'completed') AS total_paid_customers
     FROM affiliate_accounts a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC`
  );
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
  await run(`UPDATE affiliate_accounts SET ${fields.join(", ")} WHERE id = ?`, values);
  return await get("SELECT * FROM affiliate_accounts WHERE id = ?", [id]);
}

// --- Clicks ---

export async function recordClick({ affiliate_id, ip, user_agent, referrer }) {
  const id = makeId("clk");
  await run(
    "INSERT INTO clicks (id, affiliate_id, ip, user_agent, referrer, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [id, affiliate_id, ip || "", user_agent || "", referrer || ""]
  );
  await run("UPDATE affiliate_accounts SET clicks = COALESCE(clicks, 0) + 1 WHERE id = ?", [affiliate_id]);
  return { id, affiliate_id, ip, user_agent, referrer, created_at: new Date().toISOString() };
}

export async function getClicksForAffiliate(affiliateId, limit = 50) {
  return await query("SELECT * FROM clicks WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT ?", [affiliateId, limit]);
}

// --- Referrals ---

export async function createReferral({ affiliate_id, referred_user_id }) {
  const existing = await get("SELECT * FROM affiliate_referrals WHERE affiliate_id = ? AND referred_user_id = ?", [affiliate_id, referred_user_id]);
  if (existing) return existing;
  const id = makeId("ref");
  await run(
    "INSERT INTO affiliate_referrals (id, affiliate_id, referred_user_id, status, created_at) VALUES (?, ?, ?, 'pending', datetime('now'))",
    [id, affiliate_id, referred_user_id]
  );
  await run("UPDATE affiliate_accounts SET signups = COALESCE(signups, 0) + 1 WHERE id = ?", [affiliate_id]);
  return { id, affiliate_id, referred_user_id, commission: 0, status: "pending", created_at: new Date().toISOString() };
}

export async function getReferralsForAffiliate(affiliateId) {
  return await query("SELECT * FROM affiliate_referrals WHERE affiliate_id = ? ORDER BY created_at DESC", [affiliateId]);
}

export async function getReferralByUserId(userId) {
  return await get("SELECT * FROM affiliate_referrals WHERE referred_user_id = ?", [userId]);
}

export async function processReferralCommission({ referred_user_id, subscription_id, commission }) {
  const referral = await get("SELECT * FROM affiliate_referrals WHERE referred_user_id = ?", [referred_user_id]);
  if (!referral) return null;
  await run(
    "UPDATE affiliate_referrals SET subscription_id = ?, commission = ?, status = 'paid' WHERE referred_user_id = ?",
    [subscription_id, commission, referred_user_id]
  );
  await run(
    "UPDATE affiliate_accounts SET total_earnings = COALESCE(total_earnings, 0) + ?, available_balance = COALESCE(available_balance, 0) + ? WHERE id = ?",
    [commission, commission, referral.affiliate_id]
  );
  return { ...referral, subscription_id, commission, status: "paid" };
}

export async function processCommissionForPayment(payerUserId, planId, amount) {
  const referral = await getReferralByUserId(payerUserId);
  if (!referral || referral.status !== "pending") return null;
  const affiliate = await getAffiliateById(referral.affiliate_id);
  if (!affiliate) return null;
  const commission = Math.round((amount * (affiliate.commission_percent || 20)) / 100 * 100) / 100;
  return await processReferralCommission({ referred_user_id: payerUserId, subscription_id: null, commission });
}

// --- Withdrawals ---

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 10000;
const WITHDRAWAL_COOLDOWN_DAYS = 30;

export async function createWithdrawal({ affiliate_id, amount, method, account_details }) {
  const aff = await getAffiliateById(affiliate_id);
  if (!aff) return null;
  if (amount < MIN_WITHDRAWAL) return { error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` };
  if (amount > MAX_WITHDRAWAL) return { error: `Maximum withdrawal is $${MAX_WITHDRAWAL}` };
  if (amount > (aff.available_balance || 0)) return { error: "Insufficient pending balance" };
  const last = await get("SELECT created_at FROM withdrawals WHERE affiliate_id = ? AND status != 'rejected' ORDER BY created_at DESC LIMIT 1", [affiliate_id]);
  if (last) {
    const daysSince = (Date.now() - new Date(last.created_at + 'Z').getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < WITHDRAWAL_COOLDOWN_DAYS) {
      const remaining = Math.ceil(WITHDRAWAL_COOLDOWN_DAYS - daysSince);
      return { error: `You can withdraw once every ${WITHDRAWAL_COOLDOWN_DAYS} days. ${remaining} day(s) remaining.` };
    }
  }
  const id = makeId("wd");
  await run(
    "INSERT INTO withdrawals (id, affiliate_id, amount, method, account_details, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))",
    [id, affiliate_id, amount, method, account_details || ""]
  );
  await run("UPDATE affiliate_accounts SET available_balance = MAX(0, COALESCE(available_balance, 0) - ?) WHERE id = ?", [amount, affiliate_id]);
  await run(
    "INSERT INTO notifications (id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [makeId("notif"), "admin", "New Withdrawal Request", `${aff.referral_code} requested $${amount} via ${method}`]
  );
  return { id, affiliate_id, amount, method, account_details: account_details || "", status: "pending", created_at: new Date().toISOString(), processed_at: null };
}

export async function getWithdrawalsForAffiliate(affiliateId) {
  return await query("SELECT * FROM withdrawals WHERE affiliate_id = ? ORDER BY created_at DESC", [affiliateId]);
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
      await run("UPDATE affiliate_accounts SET paid_balance = COALESCE(paid_balance, 0) + ? WHERE id = ?", [wd.amount, wd.affiliate_id]);
    }
  }
  return await get("SELECT * FROM withdrawals WHERE id = ?", [id]);
}

// --- Public facing (code-based lookups) ---

export async function getAffiliateByReferralCode(code) {
  return await get("SELECT * FROM affiliate_accounts WHERE referral_code = ?", [code]);
}

export async function getClicksByAffiliateCode(code) {
  const aff = await getAffiliateByCode(code);
  if (!aff) return [];
  return await getClicksForAffiliate(aff.id);
}
