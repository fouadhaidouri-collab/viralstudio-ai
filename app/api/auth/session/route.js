import { getServerSession } from "../../../lib/session";

export async function GET() {
  const session = await getServerSession();
  if (session) {
    return Response.json({ user: { id: session.sub, name: session.name, email: session.email } });
  }
  return Response.json({ user: null });
}
