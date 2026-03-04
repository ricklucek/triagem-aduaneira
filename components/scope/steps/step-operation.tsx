"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Card } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/scope/tag-input";
import { Separator } from "@/components/ui/separator";

import { ModalType } from "@/lib/catalog/enums";
import {
  EntryLocations,
  ReleaseWarehouses,
  ExportPortsAndBorders,
} from "@/lib/catalog/locations";
import { AnuenciasOrgaos } from "@/lib/catalog/anuencias";

export function StepOperation() {
  const { watch, setValue } = useFormContext<Scope>();

  const types = watch("operation.types") ?? [];
  const hasImport = types.includes("IMPORTACAO");
  const hasExport = types.includes("EXPORTACAO");

  const opOptions = useMemo(
    () =>
      [
        { id: "IMPORTACAO", label: "Importação" },
        { id: "EXPORTACAO", label: "Exportação" },
      ] as const,
    []
  );

  // IMPORT
  const importModal = watch("importSection.modal") ?? "";
  const entryLocations = watch("importSection.entryLocations") ?? [];
  const releaseWarehouses = watch("importSection.releaseWarehouses") ?? [];
  const importNcm = watch("importSection.ncm") ?? [];
  const importCnaeSec = watch("importSection.cnaeSecundario") ?? [];
  const liEnabled = watch("importSection.liLpco.enabled") ?? false;
  const anuencias = watch("importSection.liLpco.anuencias") ?? [];

  // EXPORT
  const exportModal = watch("exportSection.modal") ?? "";
  const departureLocations = watch("exportSection.departureLocations") ?? [];
  const exportNcm = watch("exportSection.ncm") ?? [];
  const exportCnaeSec = watch("exportSection.cnaeSecundario") ?? [];

  return (
    <div className="space-y-3">
      {/* OPERAÇÃO */}
      <Card className="rounded-2xl p-4">
        <div className="mb-2 text-sm font-semibold">Operação (múltipla escolha)</div>
        <div className="text-xs text-muted-foreground">
          Selecione Importação e/ou Exportação. O formulário abre os blocos correspondentes.
        </div>

        <div className="mt-3">
          <MultiSelect
            value={types}
            onChange={(next) => setValue("operation.types", next as any, { shouldDirty: true })}
            options={opOptions as any}
            placeholder="Selecione pelo menos uma operação"
          />
        </div>
      </Card>

      {/* IMPORTAÇÃO */}
      {hasImport && (
        <Card className="rounded-2xl p-4">
          <div className="mb-3 text-sm font-semibold">Importação</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Modal</div>
              <Select
                value={importModal}
                onValueChange={(v) => setValue("importSection.modal", v as any, { shouldDirty: true })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ModalType.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m === "MARITIMO" ? "Marítimo" : m === "AEREO" ? "Aéreo" : "Rodoviário"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Local de Entrada (multi)</div>
              <MultiSelect
                value={entryLocations}
                onChange={(next) => setValue("importSection.entryLocations", next, { shouldDirty: true })}
                options={EntryLocations as any}
                placeholder="Selecione locais de entrada"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-muted-foreground">Armazém de Liberação (multi)</div>
              <MultiSelect
                value={releaseWarehouses}
                onChange={(next) => setValue("importSection.releaseWarehouses", next, { shouldDirty: true })}
                options={ReleaseWarehouses as any}
                placeholder="Selecione armazéns"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TagInput
              label="NCM (array)"
              placeholder="ex.: 8471.30.12"
              value={importNcm}
              onChange={(next) => setValue("importSection.ncm", next, { shouldDirty: true })}
            />
            <TagInput
              label="CNAE secundário (array)"
              placeholder="ex.: 46.51-6-01"
              value={importCnaeSec}
              onChange={(next) => setValue("importSection.cnaeSecundario", next, { shouldDirty: true })}
            />
          </div>

          <Separator className="my-5" />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">LI / LPCO</div>
              <Select
                value={String(liEnabled)}
                onValueChange={(v) => {
                  const enabled = v === "true";
                  setValue("importSection.liLpco.enabled", enabled, { shouldDirty: true });
                  if (!enabled) setValue("importSection.liLpco.anuencias", [], { shouldDirty: true });
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Não</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Se “Sim”, selecione os órgãos anuentes abaixo.
              </div>
            </div>

            {liEnabled && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Anuências (multi)</div>
                <MultiSelect
                  value={anuencias}
                  onChange={(next) => setValue("importSection.liLpco.anuencias", next, { shouldDirty: true })}
                  options={AnuenciasOrgaos as any}
                  placeholder="Selecione órgãos anuentes"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* EXPORTAÇÃO */}
      {hasExport && (
        <Card className="rounded-2xl p-4">
          <div className="mb-3 text-sm font-semibold">Exportação</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Modal</div>
              <Select
                value={exportModal}
                onValueChange={(v) => setValue("exportSection.modal", v as any, { shouldDirty: true })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ModalType.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m === "MARITIMO" ? "Marítimo" : m === "AEREO" ? "Aéreo" : "Rodoviário"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Portos / Fronteiras (multi)</div>
              <MultiSelect
                value={departureLocations}
                onChange={(next) => setValue("exportSection.departureLocations", next, { shouldDirty: true })}
                options={ExportPortsAndBorders as any}
                placeholder="Selecione portos e/ou fronteiras"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TagInput
              label="NCM (array)"
              placeholder="ex.: 8471.30.12"
              value={exportNcm}
              onChange={(next) => setValue("exportSection.ncm", next, { shouldDirty: true })}
            />
            <TagInput
              label="CNAE secundário (array)"
              placeholder="ex.: 46.51-6-01"
              value={exportCnaeSec}
              onChange={(next) => setValue("exportSection.cnaeSecundario", next, { shouldDirty: true })}
            />
          </div>
        </Card>
      )}
    </div>
  );
}