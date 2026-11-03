import {
  videoModels,
  textVideoModels,
  imageModels,
} from "@/app/lib/capabilities";
import { syncAllModulePrices } from "@/lib/pricing";

export async function POST() {
  const allModules = [
    ...new Map(
      [...textVideoModels, ...videoModels, ...imageModels].map((model) => [
        model.model_id || model.fal_model || model.label,
        model,
      ])
    ).values(),
  ];
  const result = await syncAllModulePrices(allModules);
  return Response.json({ success: true, ...result });
}
