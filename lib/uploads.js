import crypto from "crypto";
import { get, run } from "./db";

const MAX_IMAGE_BYTES = 700_000;
const KEEP_FOR_MS = 2 * 24 * 60 * 60 * 1000;

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await run(
    "CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)"
  );
  tableReady = true;
}

export async function saveImageDataUrl(dataUrl, origin) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    dataUrl || ""
  );

  if (!match) {
    throw new Error("Unsupported image. Upload a JPG, PNG, or WebP image.");
  }

  const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const base64 = match[2].replace(/\s+/g, "");
  const bytes = Buffer.from(base64, "base64");

  if (bytes.length === 0) {
    throw new Error("The uploaded image is empty.");
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Please upload a smaller image.");
  }

  await ensureTable();

  const id = crypto.randomUUID();
  await run(
    "INSERT INTO uploads (id, mime, data, created_at) VALUES (?, ?, ?, ?)",
    [id, mime, base64, new Date().toISOString()]
  );

  run("DELETE FROM uploads WHERE created_at < ?", [
    new Date(Date.now() - KEEP_FOR_MS).toISOString(),
  ]).catch(() => {});

  return `${origin}/api/uploads/${id}`;
}

export async function getUpload(id) {
  await ensureTable();
  return get("SELECT mime, data FROM uploads WHERE id = ?", [id]);
}
