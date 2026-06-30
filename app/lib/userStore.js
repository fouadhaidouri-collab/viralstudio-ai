import crypto from "crypto";
import { query, get, run } from "../../lib/db";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
  const id = makeId("usr");
  await run(
    "INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
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
