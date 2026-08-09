import { AdminExperience } from "@/components/admin-experience";
import { requireAdmin } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminExperience initialAuthenticated={Boolean(await requireAdmin())} />;
}
