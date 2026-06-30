import crypto from "crypto";
import { query, get, run } from "../../lib/db";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
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
  const id = email;
  await run(
    "INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
    [id, name, email, hashPassword(password)]
  );
  return { id, name, email };
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
    "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
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
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
    [hashPassword(newPassword), email]
  );
}

export async function changePassword(email, currentPassword, newPassword) {
  const user = await verifyUser(email, currentPassword);
  if (!user) throw new Error("Current password is incorrect");
  await updatePassword(email, newPassword);
}

export async function updateUserStorage(email, storageUsedBytes) {
  await run("UPDATE users SET storage_used_bytes = ? WHERE email = ?", [storageUsedBytes, email]);
}

export async function updateUserPlan(email, plan) {
  const limits = { free: 524288000, starter: 1073741824, pro: 5368709120, team: 21474836480 };
  const limit = limits[plan] || 524288000;
  await run("UPDATE users SET plan = ?, storage_limit_bytes = ? WHERE email = ?", [plan, limit, email]);
}
