"use client";

import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OperationType, ModalType } from "@/lib/catalog/enums";
import { EntryLocations, ClearanceLocations } from "@/lib/catalog/locations";
import { TagInput } from "@/components/scope/tag-input";

export function StepOperation() {
  const { watch, setValue } = useFormContext<Scope>();

  const tipo = watch("operation.tipo");
  const modal = watch("operation.modal") ?? "";
  const localEntradaId = watch("operation.localEntradaId") ?? "";
  const localLiberacaoId = watch("operation.localLiberacaoId") ?? "";

  const ncm = watch("operation.ncm") ?? [];
  const cnaeSec = watch("operation.cnaeSecundario") ?? [];

  return (
    <div className="space-y-3">
      <Card className="rounded-2xl p-4">
        <div className="mb-3 text-sm font-semibold">Operação</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Tipo</div>
            <Select
              value={tipo}
              onValueChange={(v) => setValue("operation.tipo", v as any, { shouldDirty: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {OperationType.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op === "IMPORTACAO" ? "Importação" : "Exportação"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Modal</div>
            <Select
              value={modal}
              onValueChange={(v) => setValue("operation.modal", v as any, { shouldDirty: true })}
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
            <div className="text-xs text-muted-foreground">Local de entrada</div>
            <Select
              value={localEntradaId}
              onValueChange={(v) => setValue("operation.localEntradaId", v, { shouldDirty: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EntryLocations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-3">
            <div className="text-xs text-muted-foreground">Local de liberação</div>
            <Select
              value={localLiberacaoId}
              onValueChange={(v) => setValue("operation.localLiberacaoId", v, { shouldDirty: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ClearanceLocations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TagInput
            label="NCM (array)"
            placeholder="ex.: 8471.30.12"
            value={ncm}
            onChange={(next) => setValue("operation.ncm", next, { shouldDirty: true })}
          />
          <TagInput
            label="CNAE secundário (array)"
            placeholder="ex.: 46.51-6-01"
            value={cnaeSec}
            onChange={(next) => setValue("operation.cnaeSecundario", next, { shouldDirty: true })}
          />
        </div>
      </Card>
    </div>
  );
}