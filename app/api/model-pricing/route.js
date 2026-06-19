export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpointIds = searchParams.get("endpoint_ids");
  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    return Response.json({ error: "FAL_KEY not configured" }, { status: 500 });
  }

  if (!endpointIds) {
    return Response.json({ error: "Missing endpoint_ids" }, { status: 400 });
  }

  const ids = endpointIds.split(",").filter(Boolean);
  const pricingMap = {};

  for (const eid of ids) {
    try {
      const url = `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(eid)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.prices && data.prices.length > 0) {
          const p = data.prices[0];
          pricingMap[eid] = { unitPrice: p.unit_price, unit: p.unit, currency: p.currency };
        }
      }
    } catch {
      // skip failed endpoint
    }
  }

  return Response.json({ prices: pricingMap });
}
