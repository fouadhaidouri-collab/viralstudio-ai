import { getServerSession } from "./lib/session";
import Dashboard from "./dashboard/page";
import Landing from "./landing/page";

export default async function HomePage() {
  const session = await getServerSession();
  // Logged-in users get the app dashboard, everyone else gets the marketing landing page.
  return session ? <Dashboard /> : <Landing />;
}