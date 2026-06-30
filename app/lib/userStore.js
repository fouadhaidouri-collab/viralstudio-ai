import crypto from "crypto";
import { query, get, run } from "../../lib/db";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function makeUserId() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function makeLedgerId() {
  return `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getUsers() {
  return await query("SELECT * FROM users ORDER BY created_at DESC");
}

export async function findUser(email) {
  return await get("SELECT * FROM users WHERE email = ?", [email]);
}

export async function findUserById(id) {
  return await get("SELECT * FROM users WHERE id = ?", [id]);
}

export async function createUser(name, email, password) {
  const existing = await findUser(email);
  if (existing) throw new Error("User already exists");
  const id = makeUserId();
  await run(
    "INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
    [id, name, email, hashPassword(password)]
  );
  return { id, name, email };
}

export async function createGoogleUser(name, email, image) {
  const existing = await findUser(email);
  if (existing) return existing;
  let id = makeUserId();
  while (await findUserById(id)) id = makeUserId();
  await run(
    "INSERT INTO users (id, name, email, password, avatar, email_verified, created_at, updated_at, last_login) VALUES (?, ?, ?, '', ?, 1, datetime('now'), datetime('now'), datetime('now'))",
    [id, name, email, image || '']
  );
  return { id, name, email, image: image || null };
}

export async function verifyUser(email, password) {
  const user = await findUser(email);
  if (!user) return null;
  if (user.password !== hashPassword(password)) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function saveResetToken(email, token) {
  const user = await findUser(email);
  if (!user) throw new Error("User not found");
  await run(
    "UPDATE users SET reset_token = ?, reset_token_expiry = ?, updated_at = datetime('now') WHERE email = ?",
    [token, Date.now() + 3600000, email]
  );
}

export async function verifyResetToken(email, token) {
  const user = await findUser(email);
  if (!user) return false;
  if (user.reset_token !== token) return false;
  if (!user.reset_token_expiry || user.reset_token_expiry < Date.now()) return false;
  return true;
}

export async function updatePassword(email, newPassword) {
  const user = await findUser(email);
  if (!user) throw new Error("User not found");
  await run(
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime('now') WHERE email = ?",
    [hashPassword(newPassword), email]
  );
}

export async function changePassword(email, currentPassword, newPassword) {
  const user = await verifyUser(email, currentPassword);
  if (!user) throw new Error("Current password is incorrect");
  await updatePassword(email, newPassword);
}

export async function updateLastLogin(userId) {
  await run("UPDATE users SET last_login = datetime('now'), updated_at = datetime('now') WHERE id = ?", [userId]);
}

export async function getUserPlan(userId) {
  const sub = await get(
    "SELECT us.*, p.name AS plan_name FROM user_subscriptions us LEFT JOIN plans p ON us.plan_id = p.id WHERE us.user_id = ? AND us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at >= datetime('now')) ORDER BY us.created_at DESC LIMIT 1",
    [userId]
  );
  if (sub) return { plan_id: sub.plan_id, plan_name: sub.plan_name || sub.plan_id, status: sub.status, expires_at: sub.expires_at };
  return { plan_id: 'free', plan_name: 'Free', status: 'active', expires_at: null };
}

export async function getUserCreditsBalance(userId) {
  const row = await get("SELECT current_balance FROM credits WHERE user_id = ?", [userId]);
  return row?.current_balance ?? 0;
}

export async function setUserPlan(userId, planId) {
  const existing = await get(
    "SELECT * FROM user_subscriptions WHERE user_id = ? AND status = 'active'",
    [userId]
  );
  if (existing) {
    await run("UPDATE user_subscriptions SET plan_id = ?, updated_at = datetime('now') WHERE user_id = ? AND status = 'active'", [planId, userId]);
  } else {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await run(
      "INSERT INTO user_subscriptions (id, user_id, plan_id, status, starts_at, expires_at, auto_renew) VALUES (?, ?, ?, 'active', datetime('now'), datetime('now', '+1 year'), 1)",
      [id, userId, planId]
    );
  }
}
