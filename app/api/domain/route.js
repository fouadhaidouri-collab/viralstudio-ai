import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "domains.json");

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
    const dnsTarget = process.env.VERCEL_PROJECT_ID
      ? `cname.vercel-dns.com`
      : "76.76.21.21";
    all.push({
      id: Date.now().toString(),
      domain,
      type: "custom",
      status: "pending",
      ssl_status: "pending",
      dns_target: dnsTarget,
      verification_token: generateVerificationToken(),
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    writeDomains(all);
    return NextResponse.json({ domains: all });
  }

  if (action === "verify") {
    const { id } = body;
    all = all.map((d) =>
      d.id === id ? { ...d, status: "verified", ssl_status: "active", updated_at: new Date().toISOString() } : d
    );
    writeDomains(all);
    return NextResponse.json({ domains: all });
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
