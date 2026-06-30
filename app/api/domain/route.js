import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "domains.json");
const TARGET_IP = "76.76.21.21";
const TARGET_CNAME = "cname.vercel-dns.com";

function generateVerificationToken() {
  return "vs-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function defaultDomain() {
  return {
    id: "default",
    domain: process.env.NEXT_PUBLIC_APP_URL || "viralstudio-ai-rho.vercel.app",
    type: "default",
    status: "verified",
    ssl_status: "active",
    dns_target: "-",
    is_active: true,
    verification_token: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function readDomains() {
  try {
    if (!fs.existsSync(FILE)) return [defaultDomain()];
    const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));
    if (!Array.isArray(data)) return [defaultDomain()];
    if (!data.find((d) => d.id === "default")) data.unshift(defaultDomain());
    return data;
  } catch { return [defaultDomain()]; }
}

function writeDomains(domains) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(domains, null, 2));
}

async function checkDns(domain) {
  let aRecords = [];
  let cnameRecords = [];
  try { aRecords = await resolve4(domain); } catch {}
  try { cnameRecords = await resolveCname(domain); } catch {}
  const aMatch = aRecords.includes(TARGET_IP);
  const cnameMatch = cnameRecords.includes(TARGET_CNAME);
  return { aMatch, cnameMatch, aRecords, cnameRecords };
}

export async function GET() {
  const all = readDomains();
  const active = all.find((d) => d.is_active && d.status === "verified") || all[0];
  return NextResponse.json({ domains: all, active });
}

export async function POST(req) {
  const body = await req.json();
  const { action } = body;
  let all = readDomains();

  if (action === "add") {
    const { domain } = body;
    if (!domain) return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    if (all.find((d) => d.domain === domain)) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
    }
    const dnsTarget = TARGET_CNAME;
    const token = generateVerificationToken();
    all.push({
      id: Date.now().toString(),
      domain,
      type: "custom",
      status: "pending",
      ssl_status: "pending",
      dns_target: dnsTarget,
      verification_token: token,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    writeDomains(all);
    return NextResponse.json({ domains: all });
  }

  if (action === "verify") {
    const { id } = body;
    const entry = all.find((d) => d.id === id);
    if (!entry) return NextResponse.json({ error: "Domain not found" }, { status: 404 });

    const { aMatch, cnameMatch, aRecords, cnameRecords } = await checkDns(entry.domain);

    let status = "pending";
    let sslStatus = "pending";
    let message = "";

    if (aMatch || cnameMatch) {
      status = "verified";
      sslStatus = "active";
      message = "DNS verification successful.";
    } else {
      message = `DNS not configured yet. Expected A record @ -> ${TARGET_IP} or CNAME www -> ${TARGET_CNAME}. Found A: ${aRecords.join(", ") || "none"}, CNAME: ${cnameRecords.join(", ") || "none"}`;
    }

    all = all.map((d) =>
      d.id === id ? { ...d, status, ssl_status: sslStatus, updated_at: new Date().toISOString() } : d
    );
    writeDomains(all);
    return NextResponse.json({ domains: all, message, verified: status === "verified" });
  }

  if (action === "set_active") {
    const { id } = body;
    all = all.map((d) => ({ ...d, is_active: d.id === id, updated_at: new Date().toISOString() }));
    writeDomains(all);
    return NextResponse.json({ domains: all });
  }

  if (action === "remove") {
    const { id } = body;
    all = all.filter((d) => d.id !== id);
    writeDomains(all);
    return NextResponse.json({ domains: all });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
