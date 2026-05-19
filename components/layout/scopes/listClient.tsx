"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Toolbar,
    ToolbarGroup,
    ToolbarSearchField,
} from "@/components/ui/form-layout";
import { TextInput } from "@/components/ui/form-fields";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import { formatCNPJ, isCNPJ } from "@/utils/format";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ClientApi } from "@/lib/api/types/client-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

type ListTableProps = {
    onSelectClient: (client: ClientApi) => void;
    selectedClientId?: string;
};

export default function ClientsPage({ onSelectClient, selectedClientId }: ListTableProps) {

    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);

    const params = useMemo(
        () => ({
            q: isCNPJ(q) ? undefined : q,
            cnpj: isCNPJ(q) ? q.replace(/\D/g, "") : undefined,
            limit: 100,
            offset: page - 1,
        }),
        [page, q],
    );

    const { data, isLoading, error } = useClients(params);
    const items = data?.items ?? [];

    return (
        <div>
            <div className="flex flex-col bg-background/80 p-2 md:p-4 gap-4 border-b">
                <div className="flex flex-row items-center gap-2">
                    <Search size={20} />
                    <h2 className="text-sm font-semibold tracking-tight">Filtros</h2>
                </div>

                <TextInput
                    placeholder="Buscar por razão social ou CNPJ"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                    }}
                    className="pl-10 bg-zinc-800 rounded-md"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 p-5 justify-center">
                    <RotateCw className="size-5 animate-spin" />
                </div>
            ) : error ? (
                <div className="p-5 text-sm text-destructive">
                    Falha ao carregar dados.
                </div>
            ) : items.length === 0 ? (
                <div className="p-5 text-sm">Nenhum cliente encontrado.</div>
            ) : (
                items.map((client) => {
                    const selected = selectedClientId === client.id;

                    return (
                        <div
                            key={client.id}
                            className={cn(
                                "border-b transition-colors",
                                selected ? "bg-white/10" : "hover:bg-white/5",
                            )}
                        >
                            <button
                                type="button"
                                className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                onClick={() => onSelectClient(client)}
                            >
                                <div className="flex flex-row items-center justify-between">
                                    <div>{client.cnpj ? formatCNPJ(client.cnpj) : "-"}</div>

                                    <Badge variant={client.ativo ? "default" : "secondary"}>
                                        {client.ativo ? "Ativo" : "Inativo"}
                                    </Badge>
                                </div>

                                <div className="py-4 font-medium whitespace-normal flex items-start">
                                    {client.razao_social}
                                </div>
                            </button>

                            <div className="flex flex-row items-center justify-between px-5 pb-5">
                                <span className="text-xs">
                                    Atualizado em{" "}
                                    {format(client.updated_at ?? new Date(), "dd MMM • HH:mm", {
                                        locale: ptBR,
                                    })}
                                </span>

                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}