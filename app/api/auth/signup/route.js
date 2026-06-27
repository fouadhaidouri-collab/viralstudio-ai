import { createUser } from "../../../lib/userStore";
import { getAffiliateByCode, createReferral } from "../../../../lib/affiliateStore";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const user = await createUser(name, email, password);
    // Check for referral cookie
    const refCode = request.cookies?.get?.("ref_code")?.value;
    if (refCode) {
      const affiliate = getAffiliateByCode(refCode);
      if (affiliate && affiliate.user_id !== email) {
        createReferral({
          affiliate_code: affiliate.code,
          affiliate_user_id: affiliate.user_id,
          referred_email: email,
        });
      }
    }
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    if (err.message === "User already exists") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
