import { get, run } from "./db";

const BOT_RE =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|slack|linkedin|twitter|pinterest|embedly|quora|outbrain|vkshare|w3c_validator|curl|wget|python-requests|go-http-client|node-fetch|axios|headlesschrome|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor/i;

const SKIP_EXTENSIONS =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|eot|mp4|webm|ogg|mp3|wav|flac|pdf|zip|gz|txt|xml|json|php|asp|aspx|jsp|cgi)$/i;

const SKIP_PATH_PREFIXES = [
  "/wp-admin",
  "/wp-login",
  "/xmlrpc",
  "/phpmyadmin",
  "/cgi-bin",
  "/.env",
  "/.git",
  "/config",
  "/vendor",
];

function normalizeIp(raw) {
  let ip = String(raw || "").split(",")[0].trim();
  if (!ip) return "";
  if (ip.startsWith("for=")) ip = ip.slice(4).replace(/^"|"$/g, "");
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip.startsWith("[") && ip.includes("]")) ip = ip.slice(1, ip.indexOf("]"));
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(":")[0];
  return ip.slice(0, 64);
}

function getClientIp(headers) {
  return normalizeIp(
    headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      ""
  );
}

function getCountryCode(headers) {
  const raw = (headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "")
    .trim()
    .toUpperCase();
  if (raw === "UK") return "GB";
  return /^[A-Z]{2}$/.test(raw) ? raw : "";
}

function getDeviceType(userAgent) {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|android|iphone|ipod|iemobile|opera mini/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function isPrefetch(headers) {
  return (
    headers.get("next-router-prefetch") === "1" ||
    /prefetch/i.test(headers.get("sec-purpose") || "") ||
    /prefetch/i.test(headers.get("purpose") || "")
  );
}

function isDocumentRequest(headers) {
  const destination = (headers.get("sec-fetch-dest") || "").toLowerCase();
  if (destination) return destination === "document";
  return (headers.get("accept") || "").includes("text/html");
}

function shouldSkipPath(pathname) {
  if (!pathname || pathname === "/_next" || pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_vercel/")) return true;
  if (pathname.startsWith("/.well-known/")) return true;
  if (SKIP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return true;
  }
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js") return true;
  return SKIP_EXTENSIONS.test(pathname);
}

export async function trackPageVisit(request) {
  try {
    if (request.method !== "GET") return;
    if (!isDocumentRequest(request.headers)) return;

    const url = new URL(request.url);
    const path = url.pathname;
    if (shouldSkipPath(path)) return;

    const headers = request.headers;
    if (isPrefetch(headers)) return;

    const userAgent = (headers.get("user-agent") || "").trim();
    if (!userAgent || BOT_RE.test(userAgent)) return;
    if (!/Mozilla\/|AppleWebKit\/|Gecko\/|Chrome\/|Safari\//i.test(userAgent)) return;

    const ip = getClientIp(headers);
    if (!ip) return;

    const device = getDeviceType(userAgent);
    const countryCode = getCountryCode(headers);
    const referrer = (headers.get("referer") || "").slice(0, 300);

    const recent = await get(
      `SELECT id FROM page_visits
       WHERE ip = ? AND path = ? AND device = ? AND created_at >= datetime('now', '-30 seconds')
       LIMIT 1`,
      [ip, path, device]
    );
    if (recent) return;

    await run(
      `INSERT INTO page_visits
         (id, path, ip, country_code, device, user_agent, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        path,
        ip,
        countryCode || null,
        device,
        userAgent.slice(0, 500),
        referrer || null,
      ]
    );
  } catch (err) {
    console.error("visit track error:", err);
  }
}
