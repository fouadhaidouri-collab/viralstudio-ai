import { NextResponse } from "next/server";
import { getAffiliateByCode, recordClick } from "../../../lib/affiliateStore";

export async function GET(req, { params }) {
  try {
    const { code } = await params;
    const affiliate = await getAffiliateByCode(code);
    if (!affiliate) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    await recordClick({ affiliate_id: affiliate.id, ip, user_agent: ua, referrer });
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("ref_code", code, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
