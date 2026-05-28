"use client";

import type { EscopoForm } from "@/domain/scope/types";

import { Checkbox } from "@/components/ui/form-fields";
import { Card, Stack } from "@/components/ui/form-layout";

import {
  emptyOperation,
  emptyOperationTaxes,
  type OperationType,
} from "./canonical-draft";


function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

export default function OperationsStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const operations = form.operations;

  function toggle(type: OperationType, checked: boolean) {
    const types = new Set(operations.types ?? []);
    if (checked) types.add(type);
    else types.delete(type);

    patchForm({
      operations: {
        ...operations,
        types: Array.from(types),
        importOperation: type === "IMPORT" && checked ? operations.importOperation ?? emptyOperation("IMPORT") : type === "IMPORT" ? null : operations.importOperation,
        exportOperation: type === "EXPORT" && checked ? operations.exportOperation ?? emptyOperation("EXPORT") : type === "EXPORT" ? null : operations.exportOperation,
      },
      taxes: {
        ...form.taxes,
        importTaxes: type === "IMPORT" && checked ? form.taxes.importTaxes ?? emptyOperationTaxes() : type === "IMPORT" ? null : form.taxes.importTaxes,
        exportTaxes: type === "EXPORT" && checked ? form.taxes.exportTaxes ?? emptyOperationTaxes() : type === "EXPORT" ? null : form.taxes.exportTaxes,
      },
    } as Partial<EscopoForm>);
  }

  return (
    <Card>
      <h3 className="text-base font-semibold">Tipos de operação</h3>
      <Stack>
        <Checkbox label="Importação" checked={operations.types.includes("IMPORT")} onChange={(checked) => toggle("IMPORT", checked)} />
        <Checkbox label="Exportação" checked={operations.types.includes("EXPORT")} onChange={(checked) => toggle("EXPORT", checked)} />
        {fieldError(errors, "operations.types") ? <p className="text-sm text-destructive">{fieldError(errors, "operations.types")}</p> : null}
      </Stack>
    </Card>
  );
}