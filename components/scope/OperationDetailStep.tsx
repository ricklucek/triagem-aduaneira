"use client";

import type { EscopoForm } from "@/domain/scope/types";

import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import {
  OPERATION_LABEL,
  emptyOperation,
  joinLines,
  splitLines,
  type OperationType,
} from "./canonical-draft";
import UserMultiSelect from "./blocks/UserMultiSelect";


const DESTINATIONS = [
  { value: "RESALE", label: "Revenda" },
  { value: "INDUSTRIALIZATION", label: "Industrialização" },
  { value: "USE_AND_CONSUMPTION", label: "Uso e consumo" },
  { value: "FIXED_ASSET", label: "Ativo imobilizado" },
];

function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

function boolSelectValue(value?: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function boolFromSelect(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}


function BooleanSelect({ value, onChange }: { value?: boolean | null; onChange: (value: boolean | null) => void }) {
  return (
    <Select value={boolSelectValue(value)} onChange={(e) => onChange(boolFromSelect(e.target.value))}>
      <option value="">Selecione</option>
      <option value="true">Sim</option>
      <option value="false">Não</option>
    </Select>
  );
}

export default function OperationDetailStep({
  operationType,
  form,
  patchForm,
  errors,
  responsaveis,
}: {
  operationType: OperationType;
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
  responsaveis: ScopeResponsible[];
}) {
  const key = operationType === "IMPORT" ? "importOperation" : "exportOperation";
  const operation = form.operations[key] ?? emptyOperation(operationType);
  const prefix = `operations.${key}`;
  const daKey = operationType === "IMPORT" ? "importDaAnalystIds" : "exportDaAnalystIds";
  const aeKey = operationType === "IMPORT" ? "importAeAnalystIds" : "exportAeAnalystIds";

  function patchOperation(patch: any) {
    patchForm({ operations: { ...form.operations, [key]: { ...operation, ...patch } } } as Partial<EscopoForm>);
  }

  function patchAssignments(patch: any) {
    patchForm({ assignments: { ...form.assignments, ...patch } } as Partial<EscopoForm>);
  }

  function setNcms(textValue: string) {
    patchOperation({ ncms: splitLines(textValue).map((code) => ({ code, description: null })) });
  }

  function setAuthorities(textValue: string) {
    patchOperation({ authorities: splitLines(textValue).map((name) => ({ name, code: null })) });
  }

  function setLocations(field: "entryLocations" | "customsClearanceLocations", type: "ENTRY" | "CUSTOMS_CLEARANCE", textValue: string) {
    patchOperation({ [field]: splitLines(textValue).map((name) => ({ name, code: null, rawValue: name, type })) });
  }

  function toggleDestination(value: string, checked: boolean) {
    const existing = operation.destinationPurposes ?? [];
    const next = checked
      ? [...existing, { purpose: value, consumptionSubtype: null }]
      : existing.filter((item: any) => item.purpose !== value);
    patchOperation({ destinationPurposes: next });
  }

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">{OPERATION_LABEL[operationType]}</h3>
        <Grid columns={2}>
          <UserMultiSelect
            label={`Analistas DA - ${OPERATION_LABEL[operationType]}`}
            value={(form.assignments as any)[daKey] ?? []}
            onChange={(value) => patchAssignments({ [daKey]: value })}
            options={responsaveis}
            error={fieldError(errors, `assignments.${daKey}`)}
          />
          <UserMultiSelect
            label={`Analistas AE - ${OPERATION_LABEL[operationType]}`}
            value={(form.assignments as any)[aeKey] ?? []}
            onChange={(value) => patchAssignments({ [aeKey]: value })}
            options={responsaveis}
            error={fieldError(errors, `assignments.${aeKey}`)}
          />
          <Field label="Descrição dos produtos" required error={fieldError(errors, `${prefix}.productsDescription`)}>
            <TextArea value={operation.productsDescription ?? ""} onChange={(e) => patchOperation({ productsDescription: e.target.value })} />
          </Field>
          <Field label="NCMs" required error={fieldError(errors, `${prefix}.ncms`)}>
            <TextArea value={joinLines(operation.ncms?.map((item: any) => item.code))} onChange={(e) => setNcms(e.target.value)} placeholder="Um NCM por linha" />
          </Field>
          <Field label="Observação sobre NCMs">
            <TextArea value={operation.ncmNotes ?? ""} onChange={(e) => patchOperation({ ncmNotes: e.target.value })} />
          </Field>
          <Field label="Órgãos anuentes">
            <TextArea value={joinLines(operation.authorities?.map((item: any) => item.name))} onChange={(e) => setAuthorities(e.target.value)} placeholder="Um órgão por linha" />
          </Field>
          <Field label="Outro órgão anuente / observação">
            <TextArea value={operation.otherAuthority ?? ""} onChange={(e) => patchOperation({ otherAuthority: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      {operationType === "IMPORT" ? (
        <Card>
          <h3 className="text-base font-semibold">Parâmetros de importação</h3>
          <Grid columns={2}>
            <Field label="Vínculo com exportador" required error={fieldError(errors, `${prefix}.hasExporterRelationship`)}>
              <BooleanSelect value={operation.hasExporterRelationship} onChange={(value) => patchOperation({ hasExporterRelationship: value })} />
            </Field>
            <Field label="Necessidade de DTA" required error={fieldError(errors, `${prefix}.requiresDta`)}>
              <BooleanSelect value={operation.requiresDta} onChange={(value) => patchOperation({ requiresDta: value })} />
            </Field>
            <Field label="Necessidade de DTC" required error={fieldError(errors, `${prefix}.requiresDtc`)}>
              <BooleanSelect value={operation.requiresDtc} onChange={(value) => patchOperation({ requiresDtc: value })} />
            </Field>
            <Field label="Necessidade de LI/LPCO" required error={fieldError(errors, `${prefix}.requiresLiLpco`)}>
              <BooleanSelect value={operation.requiresLiLpco} onChange={(value) => patchOperation({ requiresLiLpco: value })} />
            </Field>
            <Field label="Locais de entrada" required error={fieldError(errors, `${prefix}.entryLocations`)}>
              <TextArea value={joinLines(operation.entryLocations?.map((item: any) => item.name))} onChange={(e) => setLocations("entryLocations", "ENTRY", e.target.value)} placeholder="Um local por linha" />
            </Field>
            <Field label="Locais de desembaraço" required error={fieldError(errors, `${prefix}.customsClearanceLocations`)}>
              <TextArea value={joinLines(operation.customsClearanceLocations?.map((item: any) => item.name))} onChange={(e) => setLocations("customsClearanceLocations", "CUSTOMS_CLEARANCE", e.target.value)} placeholder="Um local por linha" />
            </Field>
          </Grid>
        </Card>
      ) : null}

      <Card>
        <h3 className="text-base font-semibold">Destinação</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {DESTINATIONS.map((option) => {
            const selected = operation.destinationPurposes?.some((item: any) => item.purpose === option.value);
            return (
              <div key={option.value} className="rounded-xl border p-3">
                <Checkbox label={option.label} checked={Boolean(selected)} onChange={(checked) => toggleDestination(option.value, checked)} />
                {selected && option.value === "USE_AND_CONSUMPTION" ? (
                  <TextInput
                    className="mt-2"
                    placeholder="Subtipo de consumo"
                    value={operation.destinationPurposes?.find((item: any) => item.purpose === option.value)?.consumptionSubtype ?? ""}
                    onChange={(e) =>
                      patchOperation({
                        destinationPurposes: operation.destinationPurposes?.map((item: any) =>
                          item.purpose === option.value ? { ...item, consumptionSubtype: e.target.value } : item,
                        ),
                      })
                    }
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </Stack>
  );
}