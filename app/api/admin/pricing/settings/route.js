import { getCreditSettings, saveCreditSettings, getModuleCreditPrices, recalculateModuleCreditPrice, getProviderPrices, saveModuleCreditPrice } from "@/lib/pricing";

export async function GET() {
  const settings = await getCreditSettings();
  return Response.json(settings);
}

export async function POST(request) {
  const body = await request.json();
  const allowed = ["credit_pack_price_usd", "credit_pack_credits", "default_markup_multiplier", "minimum_generation_credits"];

  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (updates.credit_pack_price_usd !== undefined && updates.credit_pack_credits !== undefined) {
    updates.credit_usd_value = updates.credit_pack_price_usd / updates.credit_pack_credits;
  } else if (updates.credit_pack_price_usd !== undefined || updates.credit_pack_credits !== undefined) {
    const current = await getCreditSettings();
    const price = updates.credit_pack_price_usd ?? current.credit_pack_price_usd;
    const credits = updates.credit_pack_credits ?? current.credit_pack_credits;
    updates.credit_usd_value = price / credits;
  }

  const saved = await saveCreditSettings(updates);
  const settings = { ...(await getCreditSettings()), ...saved };

  const modulePrices = await getModuleCreditPrices();
  const providerPrices = await getProviderPrices();

  for (const [moduleId, record] of Object.entries(modulePrices)) {
    const providerRecord = providerPrices[record.endpoint_id];
    if (providerRecord) {
      const updated = await recalculateModuleCreditPrice(moduleId, record.endpoint_id, providerRecord, settings);
      await saveModuleCreditPrice(updated);
    }
  }

  return Response.json({ success: true, settings });
}
