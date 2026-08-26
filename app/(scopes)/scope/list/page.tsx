"use client";

import { useRouter } from "next/navigation";
import ListTable from "@/components/layout/scopes/listTable";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <main className="w-full min-w-0">
      <ListTable
        onSelectScope={(scope) => router.push(`/scope/view/${scope.id}`)}
      />
    </main>
  );
}
