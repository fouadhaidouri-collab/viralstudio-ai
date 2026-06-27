import { getAllAffiliates, getAllWithdrawals } from "../../../../lib/affiliateStore";

export async function GET() {
  const affiliates = getAllAffiliates();
  const withdrawals = getAllWithdrawals();
  return Response.json({ affiliates, withdrawals });
}
