import { run, get } from "../../../../lib/db";
import { createUser } from "../../../lib/userStore";
import { getAffiliateByReferralCode, createReferral } from "../../../../lib/affiliateStore";

export async function POST(request) {
  try {
    const { name, email, password, ref_code } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await createUser(name, email, password);

    const refCode = request.cookies?.get?.("ref_code")?.value || ref_code;
    if (refCode) {
      const affiliate = await getAffiliateByReferralCode(refCode);
      if (affiliate && affiliate.user_id !== user.id) {
        await createReferral({
          affiliate_id: affiliate.id,
          referred_user_id: user.id,
        });
      }
    }
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
