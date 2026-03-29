import { getServerAuthSession } from "@/lib/auth/server-session";
import { AppShellClient } from "@/components/app-shell-client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();
  return <AppShellClient initialSession={session}>{children}</AppShellClient>;
}
