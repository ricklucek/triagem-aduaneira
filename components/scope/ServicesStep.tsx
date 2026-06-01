"use client";

import type { EscopoForm } from "@/domain/scope/types";
import type { ServicesDraft } from "@/domain/scope/schema";

import { Button } from "@/components/ui/button";
import { Field, NumberInput, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import ServicoToggleCard from "./blocks/ServicoToggleCard";
import {
  OPERATION_LABEL,
  PRICING_LABEL,
  SERVICE_LABEL,
  buildPreposto,
  buildServiceItem,
  type OperationType,
  type ServiceType,
} from "./canonical-draft";

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

type ServiceItemDraft = ServicesDraft["items"][number];
type PrepostoDraft = ServicesDraft["prepostos"][number];
type SpecialRegimeDetail = Extract<NonNullable<ServiceItemDraft["details"]>, { type: "SPECIAL_REGIME" }>;
type SpecialRegimeRule = SpecialRegimeDetail["regimes"][number];

type ServicesStepProps = {
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
};

const emptySpecialRegimeRule: SpecialRegimeRule = {
  name: "",
  amount: null,
};

function boolFromSelect(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function boolSelectValue(value?: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function BooleanSelect({
  value,
  onChange,
}: {
  value?: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <Select value={boolSelectValue(value)} onChange={(event) => onChange(boolFromSelect(event.target.value))}>
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

function specialRegimeDetail(service: ServiceItemDraft): SpecialRegimeDetail {
  if (service.details?.type === "SPECIAL_REGIME") return service.details;

  return {
    type: "SPECIAL_REGIME",
    regimes: [],
  };
}

export default function ServicesStep({ form, patchForm, errors }: ServicesStepProps) {
  function patchServices(patch: Partial<EscopoForm["services"]>) {
    patchForm({ services: { ...form.services, ...patch } } as Partial<EscopoForm>);
  }

  function upsertService(serviceType: ServiceType, operationType: OperationType, enabled: boolean) {
    const items = [...(form.services.items ?? [])];
    const index = items.findIndex(
      (item) => item.serviceType === serviceType && item.operationType === operationType,
    );

    if (index >= 0) {
      items[index] = { ...items[index], enabled };
    } else {
      items.push({ ...(buildServiceItem(serviceType, operationType) as ServiceItemDraft), enabled });
    }

    patchServices({ items });
  }

  function updateService(index: number, patch: Partial<ServiceItemDraft>) {
    const items = [...(form.services.items ?? [])];
    items[index] = { ...items[index], ...patch };
    patchServices({ items });
  }

  function upsertPreposto(operationType: OperationType, enabled: boolean) {
    const prepostos = [...(form.services.prepostos ?? [])];
    const index = prepostos.findIndex((item) => item.operationType === operationType);

    if (index >= 0) {
      prepostos[index] = { ...prepostos[index], enabled };
    } else {
      prepostos.push({ ...(buildPreposto(operationType) as PrepostoDraft), enabled });
    }

    patchServices({ prepostos });
  }

  function updatePreposto(index: number, patch: Partial<PrepostoDraft>) {
    const prepostos = [...(form.services.prepostos ?? [])];
    prepostos[index] = { ...prepostos[index], ...patch };
    patchServices({ prepostos });
  }

  function updateSpecialRegimes(operationType: OperationType, regimes: SpecialRegimeRule[]) {
    const items = [...(form.services.items ?? [])];
    const index = items.findIndex(
      (item) => item.serviceType === "SPECIAL_REGIME" && item.operationType === operationType,
    );
    const enabled = regimes.length > 0;

    if (index >= 0) {
      items[index] = {
        ...items[index],
        enabled,
        pricingType: "FIXED",
        details: { type: "SPECIAL_REGIME", regimes },
      };
    } else {
      items.push({
        ...(buildServiceItem("SPECIAL_REGIME", operationType) as ServiceItemDraft),
        enabled,
        details: { type: "SPECIAL_REGIME", regimes },
      });
    }

    patchServices({ items });
  }

  function renderService(operationType: OperationType, serviceType: ServiceType) {
    const index = (form.services.items ?? []).findIndex(
      (item) => item.serviceType === serviceType && item.operationType === operationType,
    );
    const service = index >= 0
      ? form.services.items[index]
      : (buildServiceItem(serviceType, operationType) as ServiceItemDraft);

    return (
      <ServicoToggleCard
        key={`${operationType}-${serviceType}`}
        title={SERVICE_LABEL[serviceType]}
        checked={Boolean(service.enabled)}
        onToggle={(checked) => upsertService(serviceType, operationType, checked)}
      >
        {index >= 0 ? (
          <Grid columns={3}>
            <Field label="Tipo de cobrança">
              <Select
                value={service.pricingType ?? ""}
                onChange={(event) => updateService(index, { pricingType: event.target.value as ServiceItemDraft["pricingType"] })}
              >
                {Object.entries(PRICING_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor">
              <NumberInput value={service.amount ?? ""} onChange={(event) => updateService(index, { amount: event.target.value })} />
            </Field>
            <Field label="Última atualização">
              <TextInput
                type="date"
                value={service.lastUpdatedOn ?? ""}
                onChange={(event) => updateService(index, { lastUpdatedOn: event.target.value })}
              />
            </Field>
            <Field label="Observações">
              <TextArea value={service.notes ?? ""} onChange={(event) => updateService(index, { notes: event.target.value })} />
            </Field>
          </Grid>
        ) : null}
      </ServicoToggleCard>
    );
  }

  function renderSpecialRegime(operationType: OperationType) {
    const specialRegimeIndex = (form.services.items ?? []).findIndex(
      (item) => item.serviceType === "SPECIAL_REGIME" && item.operationType === operationType,
    );
    const service = specialRegimeIndex >= 0
      ? form.services.items[specialRegimeIndex]
      : (buildServiceItem("SPECIAL_REGIME", operationType) as ServiceItemDraft);
    const detail = specialRegimeDetail(service);
    const errorPrefix = `services.items.${specialRegimeIndex}.details.regimes`;

    return (
      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
          <h4 className="text-sm font-semibold">Regime Especial</h4>
          <Button
            type="button"
            onClick={() => updateSpecialRegimes(operationType, [...detail.regimes, emptySpecialRegimeRule])}
          >
            + Adicionar regime especial
          </Button>
        </div>

        {detail.regimes.map((regime, index) => (
          <Card key={index} className="gap-4 p-4">
            <Grid columns={2}>
              <Field
                label="Nome do Regime"
                required
                error={specialRegimeIndex >= 0 ? errors[`${errorPrefix}.${index}.name`] : undefined}
              >
                <TextInput
                  value={regime.name ?? ""}
                  onChange={(event) => {
                    const next = [...detail.regimes];
                    next[index] = { ...regime, name: event.target.value };
                    updateSpecialRegimes(operationType, next);
                  }}
                />
              </Field>
              <Field
                label="Valor"
                required
                error={specialRegimeIndex >= 0 ? errors[`${errorPrefix}.${index}.amount`] : undefined}
              >
                <NumberInput
                  value={regime.amount ?? ""}
                  onChange={(event) => {
                    const next = [...detail.regimes];
                    next[index] = { ...regime, amount: event.target.value };
                    updateSpecialRegimes(operationType, next);
                  }}
                />
              </Field>
            </Grid>
            <div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => updateSpecialRegimes(operationType, detail.regimes.filter((_, currentIndex) => currentIndex !== index))}
              >
                Remover
              </Button>
            </div>
          </Card>
        ))}

        {specialRegimeIndex >= 0 && errors[errorPrefix] ? (
          <p className="text-sm text-destructive">{errors[errorPrefix]}</p>
        ) : null}
      </Card>
    );
  }

  function renderPreposto(operationType: OperationType) {
    const prepostoIndex = (form.services.prepostos ?? []).findIndex((item) => item.operationType === operationType);
    const preposto = prepostoIndex >= 0
      ? form.services.prepostos[prepostoIndex]
      : (buildPreposto(operationType) as PrepostoDraft);

    return (
      <ServicoToggleCard
        title="Preposto"
        checked={Boolean(preposto.enabled)}
        onToggle={(checked) => upsertPreposto(operationType, checked)}
      >
        {prepostoIndex >= 0 ? (
          <Grid columns={2}>
            <Field label="Incluso no desembaraço CASCO">
              <BooleanSelect
                value={preposto.includedInCascoCustomsClearance}
                onChange={(value) => updatePreposto(prepostoIndex, { includedInCascoCustomsClearance: value })}
              />
            </Field>
            <Field label="Valor">
              <NumberInput value={preposto.amount ?? ""} onChange={(event) => updatePreposto(prepostoIndex, { amount: event.target.value })} />
            </Field>
            <Field label="Nome do preposto manual">
              <TextInput
                value={preposto.manualPrepostoName ?? ""}
                onChange={(event) => updatePreposto(prepostoIndex, { manualPrepostoName: event.target.value, origin: "MANUAL" })}
              />
            </Field>
            <Field label="Observações do preposto">
              <TextInput
                value={preposto.manualPrepostoNotes ?? ""}
                onChange={(event) => updatePreposto(prepostoIndex, { manualPrepostoNotes: event.target.value })}
              />
            </Field>
            <Field label="Outro porto">
              <TextInput value={preposto.otherPort ?? ""} onChange={(event) => updatePreposto(prepostoIndex, { otherPort: event.target.value })} />
            </Field>
            <Field label="Outra fronteira">
              <TextInput value={preposto.otherBorder ?? ""} onChange={(event) => updatePreposto(prepostoIndex, { otherBorder: event.target.value })} />
            </Field>
          </Grid>
        ) : null}
      </ServicoToggleCard>
    );
  }

  function renderOperation(operationType: OperationType, services: ServiceType[]) {
    if (!form.operations.types.includes(operationType)) return null;

    return (
      <Card key={operationType}>
        <h3 className="text-base font-semibold">Serviços de {OPERATION_LABEL[operationType]}</h3>
        <div className="grid gap-4">
          {services.map((serviceType) => renderService(operationType, serviceType))}
          {renderSpecialRegime(operationType)}
          {operationType === "IMPORT" ? renderPreposto(operationType) : null}
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
