import { getAllAffiliates, getAllWithdrawalRequests } from "../../../../lib/affiliateStore";

export async function GET() {
  const affiliates = await getAllAffiliates();
  const withdrawals = await getAllWithdrawalRequests();
  return Response.json({ affiliates, withdrawals });
}
