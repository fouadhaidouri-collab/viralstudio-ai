import { auth } from "../../../lib/auth";
import { getOrCreateAffiliate, getReferralsForAffiliate } from "../../../../lib/affiliateStore";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, name } = session.user;
  const affiliate = getOrCreateAffiliate({ user_id: email, name: name || email.split("@")[0], email });
  const referrals = getReferralsForAffiliate(affiliate.code);
  return Response.json({ referrals });
}
