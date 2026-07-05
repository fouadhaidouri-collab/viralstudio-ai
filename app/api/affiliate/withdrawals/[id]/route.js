import { auth } from "../../../../lib/auth";
import { findUser } from "../../../../lib/userStore";
import { updateWithdrawalRequestByUser, cancelWithdrawalRequest } from "../../../../../lib/affiliateStore";

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const body = await req.json();
    const result = await updateWithdrawalRequestByUser(params.id, user.id, body);
    if (result?.error) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ withdrawal: result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const user = await findUser(session.user.email);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const result = await cancelWithdrawalRequest(params.id, user.id);
    if (result?.error) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
