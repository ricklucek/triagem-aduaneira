"use client";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useAdminDashboardMetrics } from "@/lib/api/hooks/use-dashboards";

import ScopesBySectorSection from "@/components/dashboard/admin/ScopesBySector";
import ClientsBySectorSection from "@/components/dashboard/admin/ClientsBySector";

export default function ComercialDashboardPanel() {
  const metrics = useAdminDashboardMetrics({ status: "published" });

  return (
    <main className="w-full flex flex-col gap-6 p-2 md:p-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total de escopos"><div className="text-3xl font-bold text-high -mt-5">{metrics.data?.totalScopes ?? 0}</div></DashboardCard>
        <DashboardCard title="Criados esse mês"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
        <DashboardCard title="Criados essa semana"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
        <DashboardCard title="Escopos desatualizados"><div className="text-3xl font-bold text-high -mt-5">{metrics.data?.outdatedScopes ?? 0}</div></DashboardCard>
      </section>

      <div className="w-full h-105">
        <ScopesBySectorSection />
      </div>

      <div className="w-full h-105">
        <ClientsBySectorSection />
      </div>

    </main>
  );
}


