"use client";

import { Check } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";

import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, NumberInput, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import {
  OPERATION_LABEL,
  PRICING_LABEL,
  SERVICE_LABEL,
  buildPreposto,
  buildServiceItem,
  type OperationType,
  type ServiceType,
} from "./canonical-draft";

type EtapaFormulario =
  | "COMPANY"
  | "CONTACTS"
  | "OPERATIONS"
  | "IMPORT"
  | "EXPORT"
  | "TAXES"
  | "SERVICES"
  | "FINANCIAL";

const STEP_LABELS: Record<EtapaFormulario, string> = {
  COMPANY: "Empresa",
  CONTACTS: "Contatos",
  OPERATIONS: "Operações",
  IMPORT: "Importação",
  EXPORT: "Exportação",
  TAXES: "Impostos",
  SERVICES: "Serviços",
  FINANCIAL: "Financeiro",
};

const IMPORT_SERVICES: ServiceType[] = [
  "CUSTOMS_CLEARANCE",
  "LI_LPCO_ISSUANCE",
  "PRODUCT_CATALOG_REGISTRATION",
  "CONSULTING",
  "INTERNATIONAL_FREIGHT",
  "INTERNATIONAL_INSURANCE",
  "ROAD_FREIGHT",
  "NFE_ISSUANCE",
];

const EXPORT_SERVICES: ServiceType[] = [
  "CUSTOMS_CLEARANCE",
  "CONSULTING",
  "INTERNATIONAL_FREIGHT",
  "INTERNATIONAL_INSURANCE",
  "ROAD_FREIGHT",
  "ORIGIN_CERTIFICATE",
  "PHYTOSANITARY_CERTIFICATE",
  "OTHER_CERTIFICATE",
];

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

export default function ServicesStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  function upsertService(serviceType: ServiceType, operationType: OperationType, enabled: boolean) {
    const items = [...(form.services.items ?? [])];
    const index = items.findIndex((item: any) => item.serviceType === serviceType && item.operationType === operationType);
    if (index >= 0) items[index] = { ...items[index], enabled };
    else if (enabled) items.push(buildServiceItem(serviceType, operationType));
    patchForm({ services: { ...form.services, items } } as Partial<EscopoForm>);
  }

  function updateService(index: number, patch: any) {
    const items = [...(form.services.items ?? [])];
    items[index] = { ...items[index], ...patch };
    patchForm({ services: { ...form.services, items } } as Partial<EscopoForm>);
  }

  function upsertPreposto(operationType: OperationType, enabled: boolean) {
    const prepostos = [...(form.services.prepostos ?? [])];
    const index = prepostos.findIndex((item: any) => item.operationType === operationType);
    if (index >= 0) prepostos[index] = { ...prepostos[index], enabled };
    else if (enabled) prepostos.push(buildPreposto(operationType));
    patchForm({ services: { ...form.services, prepostos } } as Partial<EscopoForm>);
  }

  function updatePreposto(index: number, patch: any) {
    const prepostos = [...(form.services.prepostos ?? [])];
    prepostos[index] = { ...prepostos[index], ...patch };
    patchForm({ services: { ...form.services, prepostos } } as Partial<EscopoForm>);
  }

  function renderOperation(operationType: OperationType, services: ServiceType[]) {
    if (!form.operations.types.includes(operationType)) return null;
    const prepostoIndex = (form.services.prepostos ?? []).findIndex((item: any) => item.operationType === operationType);
    const preposto = prepostoIndex >= 0 ? form.services.prepostos[prepostoIndex] : buildPreposto(operationType);

    return (
      <Card key={operationType}>
        <h3 className="text-base font-semibold">Serviços de {OPERATION_LABEL[operationType]}</h3>
        <div className="grid gap-4">
          {services.map((serviceType) => {
            const index = (form.services.items ?? []).findIndex((item: any) => item.serviceType === serviceType && item.operationType === operationType);
            const service = index >= 0 ? form.services.items[index] : buildServiceItem(serviceType, operationType);
            return (
              <div key={`${operationType}-${serviceType}`} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Checkbox label={SERVICE_LABEL[serviceType]} checked={Boolean(service.enabled)} onChange={(checked) => upsertService(serviceType, operationType, checked)} />
                  {service.enabled ? <Badge><Check className="mr-1 h-3 w-3" />Contrata</Badge> : null}
                </div>
                {service.enabled && index >= 0 ? (
                  <Grid columns={3}>
                    <Field label="Tipo de cobrança">
                      <Select value={service.pricingType ?? ""} onChange={(e) => updateService(index, { pricingType: e.target.value })}>
                        {Object.entries(PRICING_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </Select>
                    </Field>
                    <Field label="Valor">
                      <NumberInput value={service.amount ?? ""} onChange={(e) => updateService(index, { amount: e.target.value })} />
                    </Field>
                    <Field label="Última atualização">
                      <TextInput type="date" value={service.lastUpdatedOn ?? ""} onChange={(e) => updateService(index, { lastUpdatedOn: e.target.value })} />
                    </Field>
                    <Field label="Observações">
                      <TextArea value={service.notes ?? ""} onChange={(e) => updateService(index, { notes: e.target.value })} />
                    </Field>
                  </Grid>
                ) : null}
              </div>
            );
          })}

          <div className="rounded-xl border p-4">
            <Checkbox label="Preposto" checked={Boolean(preposto.enabled)} onChange={(checked) => upsertPreposto(operationType, checked)} />
            {preposto.enabled ? (
              <Grid columns={2}>
                <Field label="Incluso no desembaraço CASCO">
                  <BooleanSelect value={preposto.includedInCascoCustomsClearance} onChange={(value) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { includedInCascoCustomsClearance: value })} />
                </Field>
                <Field label="Valor">
                  <NumberInput value={preposto.amount ?? ""} onChange={(e) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { amount: e.target.value })} />
                </Field>
                <Field label="Nome do preposto manual">
                  <TextInput value={preposto.manualPrepostoName ?? ""} onChange={(e) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { manualPrepostoName: e.target.value, origin: "MANUAL" })} />
                </Field>
                <Field label="Observações do preposto">
                  <TextInput value={preposto.manualPrepostoNotes ?? ""} onChange={(e) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { manualPrepostoNotes: e.target.value })} />
                </Field>
                <Field label="Outro porto">
                  <TextInput value={preposto.otherPort ?? ""} onChange={(e) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { otherPort: e.target.value })} />
                </Field>
                <Field label="Outra fronteira">
                  <TextInput value={preposto.otherBorder ?? ""} onChange={(e) => prepostoIndex >= 0 && updatePreposto(prepostoIndex, { otherBorder: e.target.value })} />
                </Field>
              </Grid>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Stack>
      {renderOperation("IMPORT", IMPORT_SERVICES)}
      {renderOperation("EXPORT", EXPORT_SERVICES)}
      {fieldError(errors, "services.items") ? <p className="text-sm text-destructive">{fieldError(errors, "services.items")}</p> : null}
    </Stack>
  );
}