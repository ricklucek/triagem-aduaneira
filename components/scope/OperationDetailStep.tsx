"use client";

import type { EscopoForm } from "@/domain/scope/types";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { Field, TextArea } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";
import { OPERATION_LABEL, emptyOperation, type OperationType } from "./canonical-draft";
import UserMultiSelect from "./blocks/UserMultiSelect";
import OperationImportFields from "./OperationImportFields";
import OperationExportFields from "./OperationExportFields";

function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) if (errors[path]) return errors[path];
}

export default function OperationDetailStep({ operationType, form, patchForm, errors, responsaveis }: { operationType: OperationType; form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string>; responsaveis: ScopeResponsible[]; }) {
  const key = operationType === "IMPORT" ? "importOperation" : "exportOperation";
  const operation = form.operations[key] ?? emptyOperation(operationType);
  const prefix = `operations.${key}`;
  const daKey = operationType === "IMPORT" ? "importDaAnalystIds" : "exportDaAnalystIds";
  const aeKey = operationType === "IMPORT" ? "importAeAnalystIds" : "exportAeAnalystIds";

  const patchOperation = (patch: any) => patchForm({ operations: { ...form.operations, [key]: { ...operation, ...patch } } } as Partial<EscopoForm>);
  const patchAssignments = (patch: any) => patchForm({ assignments: { ...form.assignments, ...patch } } as Partial<EscopoForm>);

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">{OPERATION_LABEL[operationType]}</h3>
        <Grid columns={2}>
          <UserMultiSelect label={`Analistas DA - ${OPERATION_LABEL[operationType]}`} value={(form.assignments as any)[daKey] ?? []} onChange={(value) => patchAssignments({ [daKey]: value })} options={responsaveis} error={fieldError(errors, `assignments.${daKey}`)} />
          <UserMultiSelect label={`Analistas AE - ${OPERATION_LABEL[operationType]}`} value={(form.assignments as any)[aeKey] ?? []} onChange={(value) => patchAssignments({ [aeKey]: value })} options={responsaveis} error={fieldError(errors, `assignments.${aeKey}`)} />
          <Field label="Descrição dos produtos" required error={fieldError(errors, `${prefix}.productsDescription`)}>
            <TextArea value={operation.productsDescription ?? ""} onChange={(e) => patchOperation({ productsDescription: e.target.value })} />
          </Field>
          <Field label="Órgãos anuentes">
            <TextArea value={(operation.authorities ?? []).map((a: any) => a.name).join("\n")} onChange={(e) => patchOperation({ authorities: e.target.value.split("\n").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, code: null })) })} />
          </Field>
          <Field label="Outro órgão anuente / observação">
            <TextArea value={operation.otherAuthority ?? ""} onChange={(e) => patchOperation({ otherAuthority: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      {operationType === "IMPORT" ? <OperationImportFields operation={operation} patchOperation={patchOperation} errors={errors} prefix={prefix} /> : <OperationExportFields operation={operation} />}
    </Stack>
  );
}
