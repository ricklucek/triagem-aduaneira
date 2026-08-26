"use client";

import { useRouter } from "next/navigation";
import ClientsPage from "@/components/layout/scopes/listClient";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <main className="w-full min-w-0">
      <ClientsPage
        onOpenScope={(scopeId) => router.push(`/scope/view/${scopeId}`)}
        onCreateScope={(clientId) =>
          router.push(`/scope/new?clientId=${clientId}`)
        }
      />
    </main>
  );
}
