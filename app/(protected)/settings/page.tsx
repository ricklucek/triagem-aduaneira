import { redirect } from "next/navigation";
import { SettingsHome } from "@/components/settings/settings-home";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <SettingsHome role={session.user.role} />;
}
