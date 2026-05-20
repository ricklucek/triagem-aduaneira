"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminScopesByUser, useAdminUserScopes } from "@/lib/api/hooks/use-dashboards";
import type { ScopeByUserItem } from "@/lib/api/types/dashboard-api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Filter, RotateCw } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";


export default function ScopesBySectorSection() {

    const [selectedUser, setSelectedUser] = useState<ScopeByUserItem | null>(null);
    const [sectorFilter, setSectorFilter] = useState<string>("responsible");

    const isMobile = useIsMobile();

    const scopesByUser = useAdminScopesByUser({ status: "published", groupBy: sectorFilter, includeScopes: true });

    const isLoading = scopesByUser.isLoading;

    const users = useMemo(() => scopesByUser.data?.items ?? [], [scopesByUser.data?.items]);

    const usersTable = (
        <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
                {users.map((item) => (
                    <TableRow key={item.userId} onClick={() => setSelectedUser(item)} className="cursor-pointer">
                        <TableCell>{item.userName}</TableCell>
                        <TableCell>{item.userSetor || "-"}</TableCell>
                        <TableCell>{item.totalScopes}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <>
            {isMobile ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Escopos por setor</CardTitle>
                        <SectorFilterDropdown sectorFilter={sectorFilter} onSectorChange={setSectorFilter} />
                    </CardHeader>

                    {
                        isLoading ? (
                            <div className="p-4">
                                <RotateCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                                <p>Carregando...</p>
                            </div>
                        ) : (
                            <CardContent>{usersTable}</CardContent>
                        )
                    }
                </Card>
            ) : (
                <ResizablePanelGroup orientation="horizontal" className="min-h-105 rounded-lg border">
                    <ResizablePanel defaultSize="45%" minSize={35}>
                        <Card className="h-full rounded-none border-0">
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Escopos por setor</CardTitle><SectorFilterDropdown sectorFilter={sectorFilter} onSectorChange={setSectorFilter} /></CardHeader>
                            {
                                isLoading ? (
                                    <div className="p-4 flex flex-col items-center justify-center gap-5">
                                        <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <p>Carregando...</p>
                                    </div>
                                ) : (
                                    <CardContent>{usersTable}</CardContent>
                                )
                            }
                        </Card>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize="55%" minSize={35}>
                        <Card className="h-full rounded-none border-0">
                            <CardHeader><CardTitle>{selectedUser ? `Escopos com ${selectedUser.userName}` : "Selecione um usuário"}</CardTitle></CardHeader>
                            <CardContent>{selectedUser ? <UserScopesTable userId={selectedUser.userId} sectorFilter={sectorFilter} /> : <p className="text-sm text-muted-foreground">Selecione um nome na tabela para abrir os escopos.</p>}</CardContent>
                        </Card>
                    </ResizablePanel>
                </ResizablePanelGroup>
            )}

            <Sheet open={Boolean(isMobile && selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <SheetContent side="bottom" className="h-dvh w-full max-w-none rounded-none border-0 p-0">
                    <SheetHeader><SheetTitle>{selectedUser ? `Escopos com ${selectedUser.userName}` : "Escopos"}</SheetTitle></SheetHeader>
                    <div className="overflow-auto px-4 pb-4">
                        {selectedUser && <UserScopesTable userId={selectedUser.userId} sectorFilter={sectorFilter} />}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function UserScopesTable({ userId, sectorFilter }: { userId: string; sectorFilter: string }) {

    const { data, isLoading } = useAdminUserScopes(userId, { status: "published", groupBy: sectorFilter });

    const scopes = data?.items ?? [];


    if (isLoading) {
        return (
            <div className="p-4 flex flex-col items-center justify-center gap-5" >
                <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p>Carregando...</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data criação</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {scopes.map((scope) => (
                    <TableRow key={scope.id}>
                        <TableCell><Link href={`/clients/${scope.clientCnpj}/scopes/view/${scope.id}`} className="underline">{scope.clientName}</Link></TableCell>
                        <TableCell>{format(scope.createdAt, "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SectorFilterDropdown({ sectorFilter, onSectorChange }: { sectorFilter: string; onSectorChange: (value: string) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Setor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sectorFilter} onValueChange={onSectorChange}>
                    <DropdownMenuRadioItem value="responsible">Responsável Comercial</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="analista_da">Analista DA</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_by">Criado por</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}