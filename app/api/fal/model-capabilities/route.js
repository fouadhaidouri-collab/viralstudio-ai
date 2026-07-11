import { getFalKey } from "@/lib/fal-key";
import { parseFalSchema } from "@/lib/schema-parser";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpointId = searchParams.get("endpoint_id");

  if (!endpointId) {
    return Response.json({ error: "Missing endpoint_id" }, { status: 400 });
  }

  const raw = searchParams.get("raw") === "true";

  const keyResult = await getFalKey();
  if (!keyResult.hasKey) {
    return Response.json({ success: false, setupRequired: true, error: keyResult.error }, { status: 200 });
  }

  // Fetch schema
  let schema = null;
  let schemaError = null;
  let rawSchema = null;
  try {
    const schemaUrl = `https://api.fal.ai/v1/models?endpoint_id=${encodeURIComponent(endpointId)}&expand=openapi-3.0`;
    const res = await fetch(schemaUrl, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
    if (res.ok) {
      const data = await res.json();
      rawSchema = data;
      const openapiDoc = data.models?.[0]?.openapi || data;
      schema = parseFalSchema(openapiDoc);
    } else {
      schemaError = `Schema fetch returned ${res.status}`;
    }
  } catch (err) {
    schemaError = err.message;
  }

  // Fetch pricing
  let pricing = null;
  let pricingError = null;
  let rawPricing = null;
  try {
    const priceUrl = `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(endpointId)}`;
    const res = await fetch(priceUrl, {
      headers: { Authorization: `Key ${keyResult.key}` },
    });
    if (res.ok) {
      const data = await res.json();
      rawPricing = data;
      if (data.prices && data.prices.length > 0) {
        const p = data.prices[0];
        pricing = { unitPrice: p.unit_price, unit: p.unit, currency: p.currency || "USD" };
      } else {
        pricing = { unitPrice: null, pricingUnavailable: true };
      }
    } else {
      pricingError = `Pricing fetch returned ${res.status}`;
    }
  } catch (err) {
    pricingError = err.message;
  }

  // Extract supported options from schema fields
  const options = {};
  const fields = schema?.fields || [];
  for (const f of fields) {
    if (f.type === "select" && f.options) {
      options[f.name] = f.options.map(o => o.value);
    }
    if (f.type === "number") {
      options[f.name] = {
        type: "number",
        minimum: f.constraints?.minimum,
        maximum: f.constraints?.maximum,
        multipleOf: f.constraints?.multipleOf,
      };
    }
  }

  const result = {
    success: true,
    endpoint_id: endpointId,
    schema: {
      fields,
      required_fields: schema?.required_fields || [],
      options,
    },
    pricing,
    schemaError,
    pricingError,
    fetched_at: new Date().toISOString(),
  };

  if (raw) {
    result._rawSchema = rawSchema;
    result._rawPricing = rawPricing;
  }

  return Response.json(result);
}
