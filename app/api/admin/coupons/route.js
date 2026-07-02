import { auth } from "../../../lib/auth";
import { query, get, run } from "../../../../lib/db";

function makeId() {
  return `cpn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coupons = await query("SELECT * FROM coupons ORDER BY created_at DESC");
  return Response.json({ coupons });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code, discount_percent, max_uses, expires_at } = await request.json();
  if (!code || !discount_percent) {
    return Response.json({ error: "Code and discount percent are required" }, { status: 400 });
  }
  const existing = await get("SELECT id FROM coupons WHERE code = ?", [code]);
  if (existing) {
    return Response.json({ error: "Coupon code already exists" }, { status: 409 });
  }
  const id = makeId();
  await run(
    "INSERT INTO coupons (id, code, discount_percent, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)",
    [id, code.toUpperCase(), discount_percent, max_uses || 0, expires_at || null]
  );
  const coupon = await get("SELECT * FROM coupons WHERE id = ?", [id]);
  return Response.json({ coupon }, { status: 201 });
}

export async function PATCH(request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, is_active } = await request.json();
  if (!id) {
    return Response.json({ error: "Coupon ID is required" }, { status: 400 });
  }
  await run("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, id]);
  const coupon = await get("SELECT * FROM coupons WHERE id = ?", [id]);
  return Response.json({ coupon });
}

export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "Coupon ID is required" }, { status: 400 });
  }
  await run("DELETE FROM coupons WHERE id = ?", [id]);
  return Response.json({ ok: true });
}
