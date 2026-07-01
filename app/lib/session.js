import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "fa8b031c588479e50db6587f6308966761d06dfae672c23e2cdc3e41f9f5763e";

function base64url(str) {
  return Buffer.from(str).toString("base64url");
}

function sign(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verify(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: user.id, name: user.name, email: user.email, iat: now, exp: now + 2592000 });
}

export function verifyToken(token) {
  return verify(token);
}

export async function setSessionCookie(user) {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set("next-auth.session-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 2592000,
    path: "/",
  });
  return token;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("next-auth.session-token");
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("next-auth.session-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
