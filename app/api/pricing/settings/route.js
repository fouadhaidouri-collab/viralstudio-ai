import { getCreditSettings } from "@/lib/pricing";

export async function GET() {
  const settings = await getCreditSettings();
  return Response.json(settings);
}
