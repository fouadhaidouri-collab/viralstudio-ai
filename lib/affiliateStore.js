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
  await run(
    "INSERT INTO affiliate_accounts (id, user_id, referral_code, commission_percent, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [user_id, user_id, code, commission_percent]
  );
  return { id: user_id, user_id, referral_code: code, commission_percent, total_earnings: 0, available_balance: 0, paid_balance: 0, clicks: 0, signups: 0, created_at: new Date().toISOString() };
}

export async function getOrCreateAffiliate({ user_id, name, email }) {
  const existing = await getAffiliateByUserId(user_id);
  if (existing) return existing;
  const username = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  const num = String(Math.floor(100 + Math.random() * 900));
  const code = `${username.slice(0, 5)}${num}`;
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

// --- Withdrawal Requests (new table) ---

const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 10000;

export async function createWithdrawalRequest({ user_id, amount, payment_method, payment_account }) {
  const aff = await getAffiliateByUserId(user_id);
  if (!aff) return { error: "Affiliate account not found" };
  if (amount < MIN_WITHDRAWAL) return { error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` };
  if (amount > MAX_WITHDRAWAL) return { error: `Maximum withdrawal is $${MAX_WITHDRAWAL}` };
  if (amount > (aff.available_balance || 0)) return { error: "Insufficient balance" };
  const pending = await get("SELECT id FROM withdrawal_requests WHERE user_id = ? AND status = 'pending' LIMIT 1", [user_id]);
  if (pending) return { error: "You already have a pending withdrawal request. Wait for it to be processed first." };
  const id = makeId("wdr");
  await run(
    "INSERT INTO withdrawal_requests (id, user_id, amount, payment_method, payment_account, status, admin_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', '', datetime('now'), datetime('now'))",
    [id, user_id, amount, payment_method, payment_account]
  );
  await run("UPDATE affiliate_accounts SET available_balance = MAX(0, COALESCE(available_balance, 0) - ?) WHERE user_id = ?", [amount, user_id]);
  const adminUser = await get("SELECT id FROM users WHERE email = 'fouadhaidouri@gmail.com' LIMIT 1");
  const adminId = adminUser?.id || user_id;
  await run(
    "INSERT INTO notifications (id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [makeId("notif"), adminId, "New Withdrawal Request", `User ${user_id} requested $${amount} via ${payment_method}`]
  );
  return { id, user_id, amount, payment_method, payment_account, status: "pending", admin_note: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export async function updateWithdrawalRequestByUser(id, user_id, updates) {
  const old = await get("SELECT * FROM withdrawal_requests WHERE id = ? AND user_id = ?", [id, user_id]);
  if (!old) return { error: "Request not found" };
  if (old.status !== "pending") return { error: "Can only edit pending requests" };
  const fields = [];
  const values = [];
  const allowedFields = ["payment_method", "payment_account"];
  for (const [key, val] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = ?`);
    values.push(val);
  }
  if (fields.length === 0) return { error: "No valid fields to update" };
  fields.push("updated_at = datetime('now')");
  values.push(id);
  values.push(user_id);
  await run(`UPDATE withdrawal_requests SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);
  return await get("SELECT * FROM withdrawal_requests WHERE id = ?", [id]);
}

export async function cancelWithdrawalRequest(id, user_id) {
  const old = await get("SELECT * FROM withdrawal_requests WHERE id = ? AND user_id = ?", [id, user_id]);
  if (!old) return { error: "Request not found" };
  if (old.status !== "pending") return { error: "Can only cancel pending requests" };
  await run("UPDATE withdrawal_requests SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND user_id = ?", [id, user_id]);
  await run("UPDATE affiliate_accounts SET available_balance = COALESCE(available_balance, 0) + ? WHERE user_id = ?", [old.amount, user_id]);
  return { success: true };
}

export async function getWithdrawalRequestsForUser(userId) {
  return await query("SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

export async function getAllWithdrawalRequests() {
  return await query(
    `SELECT wr.*, u.name AS user_name, u.email AS user_email, a.referral_code
     FROM withdrawal_requests wr
     LEFT JOIN users u ON wr.user_id = u.id
     LEFT JOIN affiliate_accounts a ON wr.user_id = a.user_id
     ORDER BY wr.created_at DESC`
  );
}

export async function updateWithdrawalRequest(id, updates) {
  const old = await get("SELECT * FROM withdrawal_requests WHERE id = ?", [id]);
  if (!old) return null;
  if (old.status !== "pending") return { error: "Request already processed" };
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    fields.push(`${col} = ?`);
    values.push(val);
  }
  fields.push("updated_at = datetime('now')");
  if (updates.status === "approved") {
    fields.push("updated_at = datetime('now')");
  }
  values.push(id);
  await run(`UPDATE withdrawal_requests SET ${fields.join(", ")} WHERE id = ? AND status = 'pending'`, values);
  const wd = await get("SELECT * FROM withdrawal_requests WHERE id = ?", [id]);
  if (!wd) return null;
  if (updates.status === "approved") {
    await run("UPDATE affiliate_accounts SET paid_balance = COALESCE(paid_balance, 0) + ?, total_earnings = MAX(0, COALESCE(total_earnings, 0) - ?) WHERE user_id = ?", [wd.amount, wd.amount, wd.user_id]);
    await run(
      "INSERT INTO notifications (id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
      [makeId("notif"), wd.user_id, "Withdrawal Approved", `Your $${wd.amount} withdrawal has been approved.`]
    );
  } else if (updates.status === "rejected" && old.status === "pending") {
    await run("UPDATE affiliate_accounts SET available_balance = COALESCE(available_balance, 0) + ? WHERE user_id = ?", [wd.amount, wd.user_id]);
    await run(
      "INSERT INTO notifications (id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
      [makeId("notif"), wd.user_id, "Withdrawal Rejected", `Your $${wd.amount} withdrawal request has been rejected.`]
    );
  }
  return wd;
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
