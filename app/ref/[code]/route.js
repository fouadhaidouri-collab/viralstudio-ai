import { NextResponse } from "next/server";
import { getAffiliateByCode, recordClick } from "../../../lib/affiliateStore";

export async function GET(req, { params }) {
  const { code } = await params;
  const affiliate = getAffiliateByCode(code);
  if (!affiliate) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "";
  const referrer = req.headers.get("referer") || "";
  recordClick({ affiliate_code: code, ip, user_agent: ua, referrer });
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("ref_code", code, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
