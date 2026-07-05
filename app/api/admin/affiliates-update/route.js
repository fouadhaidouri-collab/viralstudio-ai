import { updateAffiliate, updateWithdrawalRequest } from "../../../../lib/affiliateStore";

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { type, id, ...updates } = body;
    if (type === "affiliate") {
      const result = await updateAffiliate(id, updates);
      if (!result) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ affiliate: result });
    }
    if (type === "withdrawal") {
      const result = await updateWithdrawalRequest(id, updates);
      if (!result) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ withdrawal: result });
    }
    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
