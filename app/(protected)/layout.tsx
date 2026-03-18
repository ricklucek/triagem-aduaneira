"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session-storage";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = getAuthSession();

  useEffect(() => {
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [pathname, router, session]);

  if (!session) {
    return <div className="p-6 text-sm text-muted-foreground">Verificando sessão...</div>;
  }

  return <>{children}</>;
}
