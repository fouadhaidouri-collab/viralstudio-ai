import { get, run } from "../../../lib/db";
import { STORAGE_LIMITS } from "../../../lib/paymentTransactions";

export async function GET(req) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await get(
    "SELECT us.*, p.storage_limit FROM user_subscriptions us LEFT JOIN plans p ON us.plan_id = p.id WHERE us.user_id = ? AND us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at >= datetime('now')) ORDER BY us.created_at DESC LIMIT 1",
    [userId]
  );

  let limitBytes = 0;
  if (sub?.plan_id && STORAGE_LIMITS[sub.plan_id]) {
    limitBytes = STORAGE_LIMITS[sub.plan_id];
  } else if (sub?.storage_limit) {
    limitBytes = Number(sub.storage_limit);
  }

  let storage = await get("SELECT * FROM storage WHERE user_id = ?", [userId]);
  if (!storage) {
    const id = `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await run(
      "INSERT INTO storage (id, user_id, used_bytes, limit_bytes, files_count) VALUES (?, ?, 0, ?, 0)",
      [id, userId, limitBytes]
    );
    storage = { used_bytes: 0, limit_bytes: limitBytes, files_count: 0 };
  }

  const usedBytes = Number(storage.used_bytes) || 0;
  const freeBytes = Math.max(0, limitBytes - usedBytes);
  const usedPercent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;

  return Response.json({
    limit_bytes: limitBytes,
    used_bytes: usedBytes,
    free_bytes: freeBytes,
    used_percent: usedPercent,
    files_count: storage.files_count || 0,
  });
}
