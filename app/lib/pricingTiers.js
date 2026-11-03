export const DEFAULT_PRICING_TIERS = [
  { maxCost: 0.02, markup: 4.0 },
  { maxCost: 0.10, markup: 3.0 },
  { maxCost: 0.50, markup: 2.2 },
  { maxCost: 1.00, markup: 1.8 },
  { maxCost: 3.00, markup: 1.5 },
  { maxCost: null, markup: 1.3 },
];

export function getMarkupMultiplier(cost, settings = {}, override = null) {
  const manual = Number(override);
  if (override !== null && override !== undefined && Number.isFinite(manual) && manual > 0) return manual;
  const amount = Math.max(0, Number(cost) || 0);
  const tiers = Array.isArray(settings.pricing_tiers) && settings.pricing_tiers.length ? settings.pricing_tiers : DEFAULT_PRICING_TIERS;
  const tier = tiers.find((item) => item.maxCost == null || amount <= Number(item.maxCost));
  return Number(tier?.markup) > 0 ? Number(tier.markup) : 1;
}
