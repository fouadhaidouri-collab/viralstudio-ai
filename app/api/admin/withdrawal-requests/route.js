import { getAllWithdrawalRequests, updateWithdrawalRequest } from "../../../../lib/affiliateStore";

export async function GET() {
  try {
    const requests = await getAllWithdrawalRequests();
    return Response.json({ requests });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status, admin_note } = await req.json();
    if (!id || !status) {
      return Response.json({ error: "id and status are required" }, { status: 400 });
    }
    if (!["approved", "rejected"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    const updates = { status };
    if (admin_note) updates.admin_note = admin_note;
    const result = await updateWithdrawalRequest(id, updates);
    if (result?.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ request: result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
