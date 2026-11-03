import { estimateModuleCredits } from "@/lib/modules";

export async function POST(request, { params }) {
  const { module_id } = await params;
  const input = await request.json();
  const result = await estimateModuleCredits(module_id, input || {});
  return Response.json(result);
}
