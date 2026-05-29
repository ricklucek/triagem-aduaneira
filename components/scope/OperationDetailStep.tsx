"use client";

import type { EscopoForm } from "@/domain/scope/types";
import type { AssignmentsDraft, OperationDraft } from "@/domain/scope/schema";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Field, TextArea } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import { OPERATION_LABEL, emptyOperation, type OperationType } from "./canonical-draft";
import UserMultiSelect from "./blocks/UserMultiSelect";
import OperationExportFields from "./OperationExportFields";
import OperationImportFields from "./OperationImportFields";

function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }

  return undefined;
}

type OperationDetailStepProps = {
  operationType: OperationType;
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
  responsaveis: ScopeResponsible[];
};

export default function OperationDetailStep({
  operationType,
  form,
  patchForm,
  errors,
  responsaveis,
}: OperationDetailStepProps) {
  const key = operationType === "IMPORT" ? "importOperation" : "exportOperation";
  const operation = (form.operations[key] ?? emptyOperation(operationType)) as OperationDraft;
  const prefix = `operations.${key}`;
  const daKey = operationType === "IMPORT" ? "importDaAnalystIds" : "exportDaAnalystIds";
  const aeKey = operationType === "IMPORT" ? "importAeAnalystIds" : "exportAeAnalystIds";

  function patchOperation(patch: Partial<OperationDraft>) {
    patchForm({
      operations: {
        ...form.operations,
        [key]: { ...operation, ...patch },
      },
    } as Partial<EscopoForm>);
  }

  function patchAssignments(patch: Partial<AssignmentsDraft>) {
    patchForm({ assignments: { ...form.assignments, ...patch } } as Partial<EscopoForm>);
  }

  function setAuthorities(textValue: string) {
    patchOperation({
      authorities: textValue
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, code: null })),
    });
  }

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">{OPERATION_LABEL[operationType]}</h3>
        <Grid columns={2}>
          <UserMultiSelect
            label={`Analistas DA - ${OPERATION_LABEL[operationType]}`}
            value={form.assignments[daKey] ?? []}
            onChange={(value) => patchAssignments({ [daKey]: value })}
            options={responsaveis}
            error={fieldError(errors, `assignments.${daKey}`)}
          />
          <UserMultiSelect
            label={`Analistas AE - ${OPERATION_LABEL[operationType]}`}
            value={form.assignments[aeKey] ?? []}
            onChange={(value) => patchAssignments({ [aeKey]: value })}
            options={responsaveis}
            error={fieldError(errors, `assignments.${aeKey}`)}
          />
          <Field label="Descrição dos produtos" required error={fieldError(errors, `${prefix}.productsDescription`)}>
            <TextArea
              value={operation.productsDescription ?? ""}
              onChange={(event) => patchOperation({ productsDescription: event.target.value })}
            />
          </Field>
          <Field label="Órgãos anuentes">
            <TextArea
              value={(operation.authorities ?? []).map((authority) => authority.name).join("\n")}
              onChange={(event) => setAuthorities(event.target.value)}
              placeholder="Um órgão por linha"
            />
          </Field>
          <Field label="Outro órgão anuente / observação">
            <TextArea
              value={operation.otherAuthority ?? ""}
              onChange={(event) => patchOperation({ otherAuthority: event.target.value })}
            />
          </Field>
        </Grid>
      </Card>

      {operationType === "IMPORT" ? (
        <OperationImportFields
          operation={operation}
          patchOperation={patchOperation}
          errors={errors}
          prefix={prefix}
        />
      ) : (
        <OperationExportFields
          operation={operation}
          patchOperation={patchOperation}
          errors={errors}
          prefix={prefix}
        />
      )}
    </Stack>
  );
}
