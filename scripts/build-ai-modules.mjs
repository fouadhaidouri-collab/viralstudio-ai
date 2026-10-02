// Generates data/ai-modules.json from the SAME source the client uses
// (app/lib/capabilities.js), so the Admin Modules page lists every AI tool
// the client can actually use.
//
// Run:  node scripts/build-ai-modules.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { videoModels, imageModels } from "../app/lib/capabilities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "data", "ai-modules.json");
const now = new Date().toISOString();

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const baseSchema = (extra) => ({
  input_schema: {
    prompt: { type: "string", description: "Prompt" },
    ...extra,
  },
  fields: [],
  required_fields: [],
  options: {},
  schema_hash: "",
  last_synced_at: "",
});

const baseCreditPricing = (markup, estimated = null) => ({
  credit_pack_price_usd: 29,
  credit_pack_credits: 1000,
  credit_usd_value: 0.029,
  markup_multiplier: markup,
  minimum_credits: 1,
  estimated_credits: estimated,
  last_calculated_at: now,
});

const modules = {};

// ── Video models (client: app/lib/capabilities.js -> videoModels) ──
videoModels.forEach((m, idx) => {
  modules[m.id] = {
    module_id: m.id,
    display_name: m.label,
    endpoint_id: m.fal_model,
    provider: "fal.ai",
    fal_metadata: {
      display_name: m.label,
      category: m.family,
      description: m.desc || "",
      tags: [],
      status: "active",
      thumbnail_url: "",
      model_url: "",
      updated_at: now,
    },
    fal_schema: baseSchema({
      image_url: { type: "string", description: "Input image URL" },
      aspect_ratio: { type: "string", enum: m.options?.aspect_ratio || [] },
      resolution: { type: "string", enum: m.options?.resolution || [] },
      duration: { type: "string", enum: m.options?.duration || [] },
    }),
    fal_pricing: {
      unit_price: null,
      unit: null,
      currency: "USD",
      pricing_unavailable: true,
      price_hash: "",
      last_synced_at: "",
    },
    credit_pricing: baseCreditPricing(m.markup),
    business_config: {
      enabled: true,
      custom_category: m.family,
      business_presets: {},
      prompt_presets: {},
      ui_order: idx,
      admin_notes: "",
    },
    created_at: now,
    updated_at: now,
  };
});

// ── Image models (client: app/lib/capabilities.js -> imageModels) ──
imageModels.forEach((m, idx) => {
  const id = slugify(m.label);
  modules[id] = {
    module_id: id,
    display_name: m.label,
    endpoint_id: m.fal_model,
    provider: m.provider || "fal.ai",
    fal_metadata: {
      display_name: m.label,
      category: m.provider || "Image",
      description: "",
      tags: [],
      status: "active",
      thumbnail_url: "",
      model_url: "",
      updated_at: now,
    },
    fal_schema: baseSchema({
      aspect_ratio: { type: "string", enum: m.options?.aspect_ratio || [] },
      resolution: { type: "string", enum: m.options?.resolution || [] },
    }),
    fal_pricing: {
      unit_price: m.unitPrice ?? null,
      unit: m.unit || null,
      currency: "USD",
      pricing_unavailable: m.unitPrice == null,
      price_hash: "",
      last_synced_at: "",
    },
    credit_pricing: baseCreditPricing(m.markup ?? 1.5, m.credits ?? null),
    business_config: {
      enabled: true,
      custom_category: m.provider || "Image",
      business_presets: {},
      prompt_presets: {},
      ui_order: 100 + idx,
      admin_notes: "",
    },
    created_at: now,
    updated_at: now,
  };
});

fs.writeFileSync(outPath, JSON.stringify(modules, null, 2), "utf-8");
const total = Object.keys(modules).length;
console.log(`Wrote ${outPath} with ${total} modules (${videoModels.length} video + ${imageModels.length} image)`);