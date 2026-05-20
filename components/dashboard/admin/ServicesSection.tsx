"use client";

import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminServicesMetrics } from "@/lib/api/hooks/use-dashboards";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function ServicesSection() {
    const services = useAdminServicesMetrics({ status: "published" });

    const [serviceCategory, setServiceCategory] = useState<"importacao" | "exportacao">("importacao");

    const filteredServices = useMemo(() => {
        const operation = serviceCategory === "importacao" ? "importacao" : "exportacao";
        return (services.data?.items ?? []).filter((item) => item.operationType.toLowerCase() === operation);
    }, [serviceCategory, services.data?.items]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Serviços cadastrados agregado</CardTitle>
                <ServiceFilterDropdown serviceCategory={serviceCategory} onServiceCategoryChange={setServiceCategory} />
            </CardHeader>
            <CardContent className="space-y-3">
                {filteredServices.map((item) => {
                    const percentage = Math.max(2, Math.min(100, item.occurrencesPercentage));
                    return (
                        <div key={item.serviceCode} className="space-y-1">
                            <div className="flex items-center justify-between text-sm"><span>{item.serviceName}</span><span className="text-muted-foreground">{item.totalScopes} escopos</span></div>
                            <div className="h-5 w-full rounded-full bg-muted/60 overflow-hidden" title={`${item.serviceName}: ${item.totalScopes} escopos (${item.occurrencesPercentage}%)`}>
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function ServiceFilterDropdown({ serviceCategory, onServiceCategoryChange }: { serviceCategory: "importacao" | "exportacao"; onServiceCategoryChange: (value: "importacao" | "exportacao") => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Categoria</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={serviceCategory} onValueChange={(value) => onServiceCategoryChange(value as "importacao" | "exportacao")}>
                    <DropdownMenuRadioItem value="importacao">Importação</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="exportacao">Exportação</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}