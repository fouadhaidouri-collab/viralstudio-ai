import { NextResponse } from "next/server";
import { get, query } from "@/lib/db";
import { getOrCreateAffiliate } from "@/lib/affiliateStore";

export async function GET() {
  try {
    const admin = await get("SELECT id, name, email FROM users WHERE email = ?", ["fouadhaidouri@gmail.com"]);
    if (!admin) {
      return NextResponse.json({ error: "Admin user not found. Login first with fouadhaidouri@gmail.com" }, { status: 404 });
    }
    const affiliate = await getOrCreateAffiliate({ user_id: admin.id, name: admin.name, email: admin.email });
    return NextResponse.json({ affiliate });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
