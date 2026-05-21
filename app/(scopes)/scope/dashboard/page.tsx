import { getServerAuthSession } from "@/lib/auth/server-session";
import DashboardRoleView from "./role-view";

export default async function ScopeDashboardPage() {
  const session = await getServerAuthSession();
  const role = session?.user.role;

  return <DashboardRoleView role={role} />;
}
