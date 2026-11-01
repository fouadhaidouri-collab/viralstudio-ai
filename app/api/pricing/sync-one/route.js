import { fetchRenderfulModelPricing, saveProviderPrice, recalculateModuleCreditPrice, saveModuleCreditPrice, getCreditSettings } from "@/lib/pricing";

export async function POST(request) {
  const { endpoint_id, module_id } = await request.json();

  if (!endpoint_id) {
    return Response.json({ error: "Missing endpoint_id" }, { status: 400 });
  }

  const providerResult = await fetchRenderfulModelPricing(endpoint_id);

  if (!providerResult.success) {
    return Response.json({ error: providerResult.error || "Sync failed" }, { status: 500 });
  }

  saveProviderPrice(providerResult);

  if (module_id) {
    const settings = getCreditSettings();
    const creditRecord = recalculateModuleCreditPrice(module_id, endpoint_id, providerResult, settings);
    saveModuleCreditPrice(creditRecord);
  }

  return Response.json({ success: true, ...providerResult });
}
