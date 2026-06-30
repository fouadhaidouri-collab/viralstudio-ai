import { getAllAffiliates, getAllWithdrawals } from "../../../../lib/affiliateStore";

export async function GET() {
  const affiliates = await getAllAffiliates();
  const withdrawals = await getAllWithdrawals();
  return Response.json({ affiliates, withdrawals });
}
