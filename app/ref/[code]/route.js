import { NextResponse } from "next/server";
import { get, run } from "../../../lib/db";

export async function GET(req, { params }) {
  try {
    const { code } = await params;
    const affiliate = await get("SELECT * FROM affiliate_accounts WHERE referral_code = ?", [code]);
    if (!affiliate) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    await run(
      "INSERT INTO clicks (id, affiliate_id, ip, user_agent, referrer, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      [`clk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, affiliate.id, ip, ua, referrer]
    );
    await run("UPDATE affiliate_accounts SET clicks = COALESCE(clicks, 0) + 1 WHERE id = ?", [affiliate.id]);
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("ref_code", code, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
