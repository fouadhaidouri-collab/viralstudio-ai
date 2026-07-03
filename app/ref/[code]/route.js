import { NextResponse } from "next/server";
import { get } from "../../../lib/db";

export async function GET(req, { params }) {
  try {
    const { code } = await params;
    const affiliate = await get("SELECT * FROM affiliate_accounts WHERE referral_code = ?", [code]);
    if (!affiliate) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("ref_code", code, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (err) {
    const resp = NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    resp.headers.set("Access-Control-Allow-Origin", "*");
    return resp;
  }
}
