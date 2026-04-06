import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  return children;
}
