"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

import { useScope } from "@/lib/api/hooks/use-scope-api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import ViewScope from "@/components/scope/ViewScope";


export default function ScopeViewLayout({ id }: { id: string }) {

    const {
        data: scopeResponse,
        isLoading: loadingScope,
        error: scopeError,
    } = useScope(id);

    const createdBy =
        (scopeResponse as any)?.createdBy ?? (scopeResponse as any)?.created_by ?? null;

    if (loadingScope) {
        return (
            <Card className="w-full p-4 text-sm text-muted-foreground">
                <div className="w-full h-full flex justify-center items-center gap-5">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Carregando visualização...
                </div>
            </Card>
        );
    }

    if (scopeError || !scopeResponse) {
        return (
            <Card className="p-4">
                <p className="font-medium">Escopo não encontrado.</p>
                <Button asChild className="mt-3">
                    <Link href={`/scope/list`}>Voltar para escopos</Link>
                </Button>
            </Card>
        );
    }

    return (
        <div className="grid gap-4" id="scope-view-layout">
            <Card className="p-4 print-avoid-break">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Visualização do Escopo
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Documento em modo leitura para acompanhamento operacional.
                        </p>

                        {createdBy ? (
                            <p className="mt-5 text-sm text-muted-foreground">
                                Criado por {createdBy.name}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                        <Button asChild variant="outline">
                            <Link href={`/scope/list`}>Voltar</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={`/scope/${id}`}>Editar</Link>
                        </Button>
                    </div>
                </div>
            </Card>

            <ViewScope scope={scopeResponse} versionLabel="Escopo atual" />

            <style jsx global>{`
        @media print {
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }

          body {
            background: white !important;
          }

          #scope-view-layout {
            gap: 12px;
          }

          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
        </div>
    );
}
