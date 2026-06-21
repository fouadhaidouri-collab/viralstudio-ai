import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getUsersFilePath() {
  if (process.env.VERCEL === "1") {
    return "/tmp/users.json";
  }
  return path.join(process.cwd(), "data", "users.json");
}

export async function getUsers() {
  const filePath = getUsersFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    if (process.env.VERCEL === "1") {
      try {
        const seedPath = path.join(process.cwd(), "data", "users.json");
        const raw = await fs.readFile(seedPath, "utf-8");
        const seed = JSON.parse(raw);
        await fs.writeFile(filePath, JSON.stringify(seed, null, 2), "utf-8");
        return seed;
      } catch { return []; }
    }
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(getUsersFilePath(), JSON.stringify(users, null, 2), "utf-8");
}

export async function findUser(email) {
  const users = await getUsers();
  return users.find((u) => u.email === email) || null;
}

export async function createUser(name, email, password) {
  const users = await getUsers();
  if (users.find((u) => u.email === email)) {
    throw new Error("User already exists");
  }
  const user = {
    id: email,
    name,
    email,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  return { id: user.id, name: user.name, email: user.email };
}

export async function verifyUser(email, password) {
  const user = await findUser(email);
  if (!user) return null;
  if (user.password !== hashPassword(password)) return null;
  return { id: user.id, name: user.name, email: user.email };
}
