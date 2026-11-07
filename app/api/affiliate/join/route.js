import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getAffiliateByCode, getAffiliateByUserId, getOrCreateAffiliate } from "../../../../lib/affiliateStore";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return Response.json({ error: "Choose a coupon code with 3–20 letters or numbers" }, { status: 400 });
    }
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUser(session.user.email);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await getAffiliateByUserId(user.id);
    if (existing) {
      return Response.json({ ok: true, affiliate: existing, existing: true });
    }

    const codeOwner = await getAffiliateByCode(code);
    if (codeOwner) {
      return Response.json({ error: "This coupon code is already taken. Please choose another one." }, { status: 409 });
    }

    const affiliate = await getOrCreateAffiliate({
      user_id: user.id,
      code,
      name: user.name || session.user.name || user.email.split("@")[0],
      email: user.email,
    });

    if (!affiliate) {
      return Response.json({ error: "Could not create affiliate account" }, { status: 500 });
    }

    return Response.json({ ok: true, affiliate, existing: false }, { status: 201 });
  } catch (err) {
    if (String(err.message || "").toLowerCase().includes("unique") || String(err.message || "").toLowerCase().includes("already in use")) {
      return Response.json({ error: "This coupon code is already taken. Please choose another one." }, { status: 409 });
    }
    console.error("affiliate join error:", err);
    return Response.json({ error: err.message || "Could not join the Affiliate Program" }, { status: 500 });
  }
}
