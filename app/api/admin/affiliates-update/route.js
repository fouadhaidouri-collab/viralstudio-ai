import { updateAffiliate, updateWithdrawal } from "../../../../lib/affiliateStore";

export async function PATCH(req) {
  const body = await req.json();
  const { type, id, ...updates } = body;
  if (type === "affiliate") {
    const result = updateAffiliate(id, updates);
    if (!result) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ affiliate: result });
  }
  if (type === "withdrawal") {
    const result = updateWithdrawal(id, updates);
    if (!result) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ withdrawal: result });
  }
  return Response.json({ error: "Invalid type" }, { status: 400 });
}
