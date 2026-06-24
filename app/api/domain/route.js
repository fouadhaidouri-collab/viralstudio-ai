import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "domains.json");

function readDomains() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch { return []; }
}

function writeDomains(domains) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(domains, null, 2));
}

export async function GET() {
  const domains = readDomains();
  return NextResponse.json({ domains });
}

export async function POST(req) {
  const { action, domain } = await req.json();
  let domains = readDomains();

  if (action === "add") {
    if (domains.find((d) => d.name === domain)) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
    }
    domains.push({ id: Date.now(), name: domain, verified: false });
    writeDomains(domains);
    return NextResponse.json({ domains });
  }

  if (action === "verify") {
    domains = domains.map((d) => d.id === domain.id ? { ...d, verified: true } : d);
    writeDomains(domains);
    return NextResponse.json({ domains });
  }

  if (action === "remove") {
    domains = domains.filter((d) => d.id !== domain.id);
    writeDomains(domains);
    return NextResponse.json({ domains });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
