"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminScopesByUser, useAdminUserScopes } from "@/lib/api/hooks/use-dashboards";
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
import { UserTagBadge } from "@/components/settings/user-tag-badge";


export default function ScopesBySectorSection({ tagId }: { tagId?: string }) {

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [sectorFilter, setSectorFilter] = useState<string>("responsible");

    const isMobile = useIsMobile();

    const scopesByUser = useAdminScopesByUser({
        status: "published",
        groupBy: sectorFilter,
        includeScopes: true,
        tagId,
    });

    const isLoading = scopesByUser.isLoading;

    const users = useMemo(() => scopesByUser.data?.items ?? [], [scopesByUser.data?.items]);
    const selectedUser = useMemo(
        () => users.find((item) => item.userId === selectedUserId) ?? null,
        [selectedUserId, users],
    );

    const usersTable = (
        <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tags</TableHead><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
                {users.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhum responsável encontrado para estes filtros.</TableCell></TableRow>
                ) : users.map((item) => (
                    <TableRow key={item.userId} onClick={() => setSelectedUserId(item.userId)} className="cursor-pointer">
                        <TableCell>{item.userName}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{(item.userTags ?? []).map((tag) => <UserTagBadge key={tag.id} tag={tag} />)}</div></TableCell>
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
                        <CardTitle>Escopos por responsável</CardTitle>
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
                <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
                    <ResizablePanel defaultSize="45%" minSize={35}>
                        <Card className="h-full rounded-none border-0">
                            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Escopos por responsável</CardTitle><SectorFilterDropdown sectorFilter={sectorFilter} onSectorChange={setSectorFilter} /></CardHeader>
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
                            <CardContent>{selectedUser ? <UserScopesTable userId={selectedUser.userId} sectorFilter={sectorFilter} tagId={tagId} /> : <p className="text-sm text-muted-foreground">Selecione um nome na tabela para abrir os escopos.</p>}</CardContent>
                        </Card>
                    </ResizablePanel>
                </ResizablePanelGroup>
            )}

            <Sheet open={Boolean(isMobile && selectedUser)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
                <SheetContent side="bottom" className="h-dvh w-full max-w-none rounded-none border-0 p-0">
                    <SheetHeader><SheetTitle>{selectedUser ? `Escopos com ${selectedUser.userName}` : "Escopos"}</SheetTitle></SheetHeader>
                    <div className="overflow-auto px-4 pb-4">
                        {selectedUser && <UserScopesTable userId={selectedUser.userId} sectorFilter={sectorFilter} tagId={tagId} />}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

function UserScopesTable({ userId, sectorFilter, tagId }: { userId: string; sectorFilter: string; tagId?: string }) {

    const { data, isLoading } = useAdminUserScopes(userId, { status: "published", groupBy: sectorFilter, tagId });

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
                {scopes.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Nenhum escopo encontrado.</TableCell></TableRow>
                ) : scopes.map((scope) => (
                    <TableRow key={scope.id}>
                        <TableCell><Link href={`/scope/view/${scope.id}`} className="underline">{scope.clientName}</Link></TableCell>
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
                <DropdownMenuLabel>Vínculo com o escopo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sectorFilter} onValueChange={onSectorChange}>
                    <DropdownMenuRadioItem value="responsible">Responsável Comercial</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="analista_da">Analista DA</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="analista_ae">Analista AE</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_by">Criado por</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
