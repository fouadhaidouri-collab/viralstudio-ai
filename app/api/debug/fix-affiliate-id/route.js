import { query } from "../../../../lib/db";

export async function GET() {
  const fk = {};
  for (const tbl of ["clicks", "affiliate_referrals", "withdrawals", "affiliate_accounts"]) {
    fk[tbl] = await query(`PRAGMA foreign_key_list(${tbl})`);
  }
  return Response.json(fk);
}
