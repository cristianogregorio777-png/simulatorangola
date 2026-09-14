import { getCurrentUser } from "@/lib/supabase/server";
import { SimulationGate } from "@/components/simulation/SimulationGate";

export default async function SimulationPage() {
  const user = await getCurrentUser();

  return <SimulationGate userEmail={user?.email ?? null} />;
}
