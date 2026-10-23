import { auth } from "../../../lib/auth";
import { findUser } from "../../../lib/userStore";
import { getAffiliateByUserId, getOrCreateAffiliate } from "../../../../lib/affiliateStore";

export async function POST() {
  try {
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

    const affiliate = await getOrCreateAffiliate({
      user_id: user.id,
      name: user.name || session.user.name || user.email.split("@")[0],
      email: user.email,
    });

    if (!affiliate) {
      return Response.json({ error: "Could not create affiliate account" }, { status: 500 });
    }

    return Response.json({ ok: true, affiliate, existing: false }, { status: 201 });
  } catch (err) {
    console.error("affiliate join error:", err);
    return Response.json({ error: err.message || "Could not join the Affiliate Program" }, { status: 500 });
  }
}
