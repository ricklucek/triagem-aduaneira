"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, RotateCw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/form-fields";
import {
  Grid,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Section,
  StepPills,
} from "@/components/ui/form-layout";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import {
  consentingAgencyOptions,
  consumptionSubtypeOptions,
  defaultTrackerProcessForm,
  insuranceOptions,
  maritimeSubtypeOptions,
  modalOptions,
  operationTypeOptions,
  purposeOptions,
  quoteStatusOptions,
  responsibleOptions,
  specialRegimeOptions,
  TRACKER_PROCESS_STEPS,
  type TrackerProcessForm,
  type TrackerProcessStep,
  validateTrackerForm,
  validateTrackerStep,
  yesNoConfirmOptions,
  yesNoOptions,
} from "@/domain/tracker/process-form";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import { importProcessesApi } from "@/lib/api/services/import-processes";
import type { ClientApi } from "@/lib/api/types/client-api";
import type {
  CreateImportProcessPayload,
  FreightQuoteStatus,
  ImportProcessServiceType,
  InternationalFreightResponsibility,
} from "@/lib/api/types/import-process-api";
import { cn } from "@/lib/utils";
import { formatCNPJ, isCNPJ } from "@/utils/format";

const STORAGE_KEY = "tracker:process:new:draft";

const stepLabels: Record<TrackerProcessStep, string> = {
  IDENTIFICATION: "Identificação",
  OPERATION: "Operação",
  SCOPE: "Escopo",
};

function mergeForm(value: unknown): TrackerProcessForm {
  if (!value || typeof value !== "object") return defaultTrackerProcessForm;

  return {
    ...defaultTrackerProcessForm,
    ...(value as Partial<TrackerProcessForm>),
    identification: {
      ...defaultTrackerProcessForm.identification,
      ...(value as Partial<TrackerProcessForm>).identification,
      client: {
        ...defaultTrackerProcessForm.identification.client,
        ...(value as Partial<TrackerProcessForm>).identification?.client,
      },
    },
    operation: {
      ...defaultTrackerProcessForm.operation,
      ...(value as Partial<TrackerProcessForm>).operation,
    },
    scope: {
      ...defaultTrackerProcessForm.scope,
      ...(value as Partial<TrackerProcessForm>).scope,
      contractedServices: {
        ...defaultTrackerProcessForm.scope.contractedServices,
        ...(value as Partial<TrackerProcessForm>).scope?.contractedServices,
      },
    },
  };
}

function toIsoDate(date?: string) {
  if (!date) return undefined;
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) return undefined;
  return `${year}-${month}-${day}`;
}

function asFreightResponsibility(
  responsibleType: string,
): InternationalFreightResponsibility {
  if (responsibleType === "CASCO") return "internal";
  if (responsibleType === "CLIENTE") return "client";
  if (responsibleType === "TERCEIRO") return "third_party";
  return "not_applicable";
}

function asQuoteStatus(value: string): FreightQuoteStatus {
  if (value === "APROVADA") return "approved";
  if (value === "REPROVADA") return "rejected";
  return "not_requested";
}

function selectedServices(
  data: TrackerProcessForm,
): ImportProcessServiceType[] {
  const services = data.scope.contractedServices;
  return [
    services.customsClearance.responsibleType ? "customs_clearance" : null,
    services.advisory.responsibleType ? "advisory" : null,
    services.roadFreight.responsibleType ? "road_freight" : null,
    services.internationalFreight.responsibleType
      ? "international_freight"
      : null,
    services.internationalInsurance.option === "SIM" ||
    services.internationalInsurance.option === "CASO_A_CASO"
      ? "international_insurance"
      : null,
  ].filter(Boolean) as ImportProcessServiceType[];
}

function nullableText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildPayload(data: TrackerProcessForm): CreateImportProcessPayload {
  const services = selectedServices(data);
  const estimatedDepartureAt = toIsoDate(data.operation.etd) ?? null;
  const estimatedArrivalAt = toIsoDate(data.operation.eta) ?? null;
  const tags = [
    data.scope.dta === "SIM" ? { tag_type: "dta" as const } : null,
    data.scope.dtc === "SIM" ? { tag_type: "dtc" as const } : null,
    data.scope.li === "SIM" ? { tag_type: "li_lpco" as const } : null,
  ].filter(Boolean) as NonNullable<CreateImportProcessPayload["tags"]>;
  const processNumber =
    nullableText(data.identification.internalReference) ??
    nullableText(data.identification.clientReference) ??
    "Novo processo";

  return {
    process_number: processNumber,
    internal_reference: nullableText(data.identification.internalReference),
    client_reference: nullableText(data.identification.clientReference),
    client_id: data.identification.client.id,
    opened_at: new Date().toISOString(),
    current_stage: "pre_shipment",
    metadata_json: data,
    shipment: {
      estimated_departure_at: estimatedDepartureAt,
      estimated_arrival_at: estimatedArrivalAt,
    },
    freight: {
      international_freight_responsibility: asFreightResponsibility(
        data.scope.contractedServices.internationalFreight.responsibleType,
      ),
      quote_status: asQuoteStatus(
        data.scope.contractedServices.roadFreight.quoteStatus,
      ),
      provider_name:
        nullableText(
          data.scope.contractedServices.internationalFreight.responsibleName,
        ) ??
        nullableText(data.scope.contractedServices.roadFreight.responsibleName),
    },
    services: services.map((service_type, index) => ({
      service_type,
      status: index === 0 ? "in_progress" : "pending",
    })),
    tags,
  };
}

function getNestedError(errors: Record<string, string>, path: string) {
  return (
    errors[path] ??
    errors[path.replace(/^(identification|operation|scope)\./, "")]
  );
}

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            className="rounded-xl"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function ClientDropdown({
  value,
  onSelect,
  error,
}: {
  value: TrackerProcessForm["identification"]["client"];
  onSelect: (client: ClientApi) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const params = useMemo(
    () => ({
      q: isCNPJ(q) ? undefined : q,
      cnpj: isCNPJ(q) ? q.replace(/\D/g, "") : undefined,
      limit: 50,
      offset: 0,
    }),
    [q],
  );

  const { data, isLoading, error: clientsError } = useClients(params);
  const clients = data?.items ?? [];
  const selectedLabel = value.id
    ? value.name
    : "Selecione um cliente para o processo";

  return (
    <Field label="Cliente" required error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            className={cn(
              "h-auto min-h-12 w-full justify-between rounded-xl px-4 py-3 text-left font-normal",
              error && "border-destructive bg-destructive/5",
            )}
          >
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm font-medium",
                  !value.id && "text-muted-foreground",
                )}
              >
                {selectedLabel}
              </span>
              {value.id ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {value.taxId ? formatCNPJ(value.taxId) : "CNPJ não informado"}
                </span>
              ) : null}
            </span>
            <ChevronsUpDown className="ml-3 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                autoFocus
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar por razão social ou CNPJ"
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <RotateCw className="size-4 animate-spin" />
                Buscando clientes...
              </div>
            ) : clientsError ? (
              <div className="px-4 py-6 text-sm text-destructive">
                Falha ao carregar clientes.
              </div>
            ) : clients.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Nenhum cliente encontrado.
              </div>
            ) : (
              clients.map((client) => {
                const selected = client.id === value.id;

                return (
                  <button
                    key={client.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none",
                      selected && "bg-primary/10 text-primary",
                    )}
                    onClick={() => {
                      onSelect(client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {client.razao_social}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {client.cnpj
                          ? formatCNPJ(client.cnpj)
                          : "CNPJ não informado"}
                      </span>
                    </span>
                    <Badge
                      variant={client.ativo ? "default" : "secondary"}
                      className="shrink-0 rounded-full"
                    >
                      {client.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function ClientSearchStep({
  form,
  setForm,
  errors,
}: {
  form: TrackerProcessForm;
  setForm: (next: TrackerProcessForm) => void;
  errors: Record<string, string>;
}) {
  function selectClient(client: ClientApi) {
    setForm({
      ...form,
      identification: {
        ...form.identification,
        client: {
          id: client.id,
          name: client.razao_social,
          taxId: client.cnpj,
        },
      },
    });
  }

  return (
    <Section
      title="Identificação"
      description="Selecione o cliente e informe as referências internas do processo."
    >
      <ClientDropdown
        value={form.identification.client}
        onSelect={selectClient}
        error={getNestedError(errors, "identification.client.id")}
      />

      <Grid>
        <Field label="Referência SISCASCO">
          <TextInput
            name="internalReference"
            value={form.identification.internalReference ?? ""}
            onChange={(event) =>
              setForm({
                ...form,
                identification: {
                  ...form.identification,
                  internalReference: event.target.value,
                },
              })
            }
          />
        </Field>
        <Field label="Referência do cliente">
          <TextInput
            name="clientReference"
            value={form.identification.clientReference ?? ""}
            onChange={(event) =>
              setForm({
                ...form,
                identification: {
                  ...form.identification,
                  clientReference: event.target.value,
                },
              })
            }
          />
        </Field>
      </Grid>
    </Section>
  );
}

function OperationStep({
  form,
  setForm,
  errors,
}: {
  form: TrackerProcessForm;
  setForm: (next: TrackerProcessForm) => void;
  errors: Record<string, string>;
}) {
  const operation = form.operation;
  const update = (patch: Partial<TrackerProcessForm["operation"]>) =>
    setForm({ ...form, operation: { ...operation, ...patch } });

  return (
    <Section
      title="Operação"
      description="Cadastre as características da operação e as datas estimadas."
    >
      <Field label="Tipo de operação">
        <MultiSelect
          value={operation.operationTypes}
          onChange={(value) =>
            update({ operationTypes: value as typeof operation.operationTypes })
          }
          options={operationTypeOptions}
          placeholder="Selecione importação, exportação ou ambos"
        />
      </Field>

      <Grid>
        <Field label="Incoterm">
          <TextInput
            value={operation.incoterm ?? ""}
            placeholder="FOB, CIF, EXW, DAP, ..."
            onChange={(event) => update({ incoterm: event.target.value })}
          />
        </Field>
        <Field label="Modal" error={getNestedError(errors, "operation.modal")}>
          <RadioGroup
            name="Modal"
            value={operation.modal}
            onChange={(value) =>
              update({
                modal: value,
                maritimeSubtype:
                  value === "MARITIMO" ? operation.maritimeSubtype : "",
              })
            }
            options={modalOptions}
          />
        </Field>
      </Grid>

      {operation.modal === "MARITIMO" ? (
        <Field
          label="Subtipo"
          error={getNestedError(errors, "operation.maritimeSubtype")}
        >
          <RadioGroup
            name="Subtipo"
            value={operation.maritimeSubtype}
            onChange={(value) => update({ maritimeSubtype: value })}
            options={maritimeSubtypeOptions}
          />
        </Field>
      ) : null}

      <Grid>
        <Field label="ETD" error={getNestedError(errors, "operation.etd")}>
          <TextInput
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={operation.etd ?? ""}
            onChange={(event) => update({ etd: event.target.value })}
          />
        </Field>
        <Field label="ETA" error={getNestedError(errors, "operation.eta")}>
          <TextInput
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            value={operation.eta ?? ""}
            onChange={(event) => update({ eta: event.target.value })}
          />
        </Field>
        <Field label="Importador">
          <TextInput
            placeholder="Nome do importador"
            value={operation.importer ?? ""}
            onChange={(event) => update({ importer: event.target.value })}
          />
        </Field>
        <Field label="Exportador">
          <TextInput
            placeholder="Nome do exportador"
            value={operation.exporter ?? ""}
            onChange={(event) => update({ exporter: event.target.value })}
          />
        </Field>
      </Grid>

      <Field
        label="Finalidade"
        error={getNestedError(errors, "operation.purpose")}
      >
        <RadioGroup
          name="Finalidade"
          value={operation.purpose}
          onChange={(value) =>
            update({
              purpose: value,
              purposeDescription:
                value === "OUTRO" ? operation.purposeDescription : "",
              consumptionSubtype:
                value === "CONSUMO" ? operation.consumptionSubtype : "",
            })
          }
          options={purposeOptions}
        />
      </Field>

      {operation.purpose === "OUTRO" ? (
        <Field
          label="Descreva a finalidade"
          error={getNestedError(errors, "operation.purposeDescription")}
        >
          <TextInput
            placeholder="Descreva a finalidade"
            value={operation.purposeDescription ?? ""}
            onChange={(event) =>
              update({ purposeDescription: event.target.value })
            }
          />
        </Field>
      ) : null}

      {operation.purpose === "CONSUMO" ? (
        <Field
          label="Tipo de consumo"
          error={getNestedError(errors, "operation.consumptionSubtype")}
        >
          <RadioGroup
            name="Tipo de consumo"
            value={operation.consumptionSubtype}
            onChange={(value) => update({ consumptionSubtype: value })}
            options={consumptionSubtypeOptions}
          />
        </Field>
      ) : null}
    </Section>
  );
}

type ResponsibleType = "CASCO" | "CLIENTE" | "TERCEIRO" | "";
type QuoteStatusOption = "APROVADA" | "REPROVADA" | "";
type ResponsibilityValue = {
  responsibleType: ResponsibleType;
  responsibleName?: string;
  quoteStatus?: QuoteStatusOption;
};

function ResponsibilityFields({
  label,
  value,
  onChange,
  errorPrefix,
  errors,
  withQuoteStatus = false,
}: {
  label: string;
  value: ResponsibilityValue;
  onChange: (value: ResponsibilityValue) => void;
  errorPrefix: string;
  errors: Record<string, string>;
  withQuoteStatus?: boolean;
}) {
  const showResponsible =
    value.responsibleType === "CASCO" || value.responsibleType === "TERCEIRO";

  return (
    <Card className="rounded-2xl p-4">
      <div className="space-y-4">
        <Field
          label={label}
          error={getNestedError(errors, `${errorPrefix}.responsibleType`)}
        >
          <RadioGroup
            name={label}
            value={value.responsibleType}
            onChange={(next) =>
              onChange({
                ...value,
                responsibleType: next,
                responsibleName:
                  next === "CASCO" || next === "TERCEIRO"
                    ? value.responsibleName
                    : "",
              })
            }
            options={responsibleOptions}
          />
        </Field>

        {showResponsible ? (
          <Field
            label="Responsável"
            error={getNestedError(errors, `${errorPrefix}.responsibleName`)}
          >
            <TextInput
              placeholder="Nome do responsável"
              value={value.responsibleName ?? ""}
              onChange={(event) =>
                onChange({ ...value, responsibleName: event.target.value })
              }
            />
          </Field>
        ) : null}

        {withQuoteStatus ? (
          <Field label="Status da cotação">
            <RadioGroup
              name={`${label} status da cotação`}
              value={value.quoteStatus ?? ""}
              onChange={(next) => onChange({ ...value, quoteStatus: next })}
              options={quoteStatusOptions}
            />
          </Field>
        ) : null}
      </div>
    </Card>
  );
}

function ScopeStep({
  form,
  setForm,
  errors,
}: {
  form: TrackerProcessForm;
  setForm: (next: TrackerProcessForm) => void;
  errors: Record<string, string>;
}) {
  const scope = form.scope;
  const contractedServices = scope.contractedServices;
  const updateScope = (patch: Partial<TrackerProcessForm["scope"]>) =>
    setForm({ ...form, scope: { ...scope, ...patch } });
  function updateService<
    K extends keyof TrackerProcessForm["scope"]["contractedServices"],
  >(key: K, value: TrackerProcessForm["scope"]["contractedServices"][K]) {
    updateScope({
      contractedServices: {
        ...contractedServices,
        [key]: value,
      },
    });
  }

  return (
    <div className="space-y-6">
      <Section
        title="Serviços contratados"
        description="Indique quem será responsável por cada serviço do processo."
      >
        <Grid>
          <ResponsibilityFields
            label="Despacho aduaneiro"
            value={contractedServices.customsClearance}
            onChange={(value) => updateService("customsClearance", value)}
            errorPrefix="scope.contractedServices.customsClearance"
            errors={errors}
          />
          <ResponsibilityFields
            label="Assessoria"
            value={contractedServices.advisory}
            onChange={(value) => updateService("advisory", value)}
            errorPrefix="scope.contractedServices.advisory"
            errors={errors}
          />
          <ResponsibilityFields
            label="Frete Rodoviário"
            value={contractedServices.roadFreight}
            onChange={(value) =>
              updateService("roadFreight", {
                ...value,
                quoteStatus: value.quoteStatus ?? "",
              })
            }
            errorPrefix="scope.contractedServices.roadFreight"
            errors={errors}
            withQuoteStatus
          />
          <ResponsibilityFields
            label="Frete Internacional"
            value={contractedServices.internationalFreight}
            onChange={(value) => updateService("internationalFreight", value)}
            errorPrefix="scope.contractedServices.internationalFreight"
            errors={errors}
          />
          <Card className="rounded-2xl p-4 lg:col-span-2">
            <Field
              label="Seguro internacional"
              error={getNestedError(
                errors,
                "scope.contractedServices.internationalInsurance.option",
              )}
            >
              <RadioGroup
                name="Seguro internacional"
                value={contractedServices.internationalInsurance.option}
                onChange={(value) =>
                  updateService("internationalInsurance", {
                    ...contractedServices.internationalInsurance,
                    option: value,
                    responsibleName:
                      value === "SIM"
                        ? contractedServices.internationalInsurance
                            .responsibleName
                        : "",
                  })
                }
                options={insuranceOptions}
              />
            </Field>
            {contractedServices.internationalInsurance.option === "SIM" ? (
              <Field
                label="Responsável pelo seguro"
                error={getNestedError(
                  errors,
                  "scope.contractedServices.internationalInsurance.responsibleName",
                )}
              >
                <TextInput
                  placeholder="Nome do responsável"
                  value={
                    contractedServices.internationalInsurance.responsibleName ??
                    ""
                  }
                  onChange={(event) =>
                    updateService("internationalInsurance", {
                      ...contractedServices.internationalInsurance,
                      responsibleName: event.target.value,
                    })
                  }
                />
              </Field>
            ) : null}
          </Card>
        </Grid>
      </Section>

      <Section title="Requisitos e particularidades">
        <Grid>
          <Field
            label="Regime Especial"
            error={getNestedError(errors, "scope.specialRegime")}
          >
            <RadioGroup
              name="Regime Especial"
              value={scope.specialRegime}
              onChange={(value) =>
                updateScope({
                  specialRegime: value,
                  specialRegimeType:
                    value === "SIM" ? scope.specialRegimeType : "",
                })
              }
              options={yesNoOptions}
            />
          </Field>
          {scope.specialRegime === "SIM" ? (
            <Field
              label="Tipo de regime especial"
              error={getNestedError(errors, "scope.specialRegimeType")}
            >
              <RadioGroup
                name="Tipo de regime especial"
                value={scope.specialRegimeType}
                onChange={(value) => updateScope({ specialRegimeType: value })}
                options={specialRegimeOptions}
              />
            </Field>
          ) : null}
          <Field label="Drawback">
            <RadioGroup
              name="Drawback"
              value={scope.drawback}
              onChange={(value) => updateScope({ drawback: value })}
              options={yesNoOptions}
            />
          </Field>
          <Field label="DTA" error={getNestedError(errors, "scope.dta")}>
            <RadioGroup
              name="DTA"
              value={scope.dta}
              onChange={(value) =>
                updateScope({
                  dta: value,
                  dtaDestination: value === "SIM" ? scope.dtaDestination : "",
                })
              }
              options={yesNoOptions}
            />
          </Field>
          {scope.dta === "SIM" ? (
            <Field
              label="Destino DTA"
              error={getNestedError(errors, "scope.dtaDestination")}
            >
              <TextInput
                placeholder="Destino DTA"
                value={scope.dtaDestination ?? ""}
                onChange={(event) =>
                  updateScope({ dtaDestination: event.target.value })
                }
              />
            </Field>
          ) : null}
          <Field label="DTC" error={getNestedError(errors, "scope.dtc")}>
            <RadioGroup
              name="DTC"
              value={scope.dtc}
              onChange={(value) =>
                updateScope({
                  dtc: value,
                  dtcDestination: value === "SIM" ? scope.dtcDestination : "",
                })
              }
              options={yesNoOptions}
            />
          </Field>
          {scope.dtc === "SIM" ? (
            <Field
              label="Destino DTC"
              error={getNestedError(errors, "scope.dtcDestination")}
            >
              <TextInput
                placeholder="Destino DTC"
                value={scope.dtcDestination ?? ""}
                onChange={(event) =>
                  updateScope({ dtcDestination: event.target.value })
                }
              />
            </Field>
          ) : null}
          <Field label="LI" error={getNestedError(errors, "scope.li")}>
            <RadioGroup
              name="LI"
              value={scope.li}
              onChange={(value) =>
                updateScope({
                  li: value,
                  consentingAgencies:
                    value === "SIM" ? scope.consentingAgencies : [],
                })
              }
              options={yesNoConfirmOptions}
            />
          </Field>
          {scope.li === "SIM" ? (
            <Field
              label="Órgãos anuentes"
              error={getNestedError(errors, "scope.consentingAgencies")}
            >
              <MultiSelect
                value={scope.consentingAgencies}
                onChange={(value) => updateScope({ consentingAgencies: value })}
                options={consentingAgencyOptions}
                placeholder="Selecione os órgãos anuentes"
              />
            </Field>
          ) : null}
          <Field
            label="Carga Perigosa"
            error={getNestedError(errors, "scope.dangerousCargo")}
          >
            <RadioGroup
              name="Carga Perigosa"
              value={scope.dangerousCargo}
              onChange={(value) =>
                updateScope({
                  dangerousCargo: value,
                  dangerousCargoDescription:
                    value === "SIM" ? scope.dangerousCargoDescription : "",
                })
              }
              options={yesNoConfirmOptions}
            />
          </Field>
          {scope.dangerousCargo === "SIM" ? (
            <Field
              label="Tipo de carga perigosa"
              error={getNestedError(errors, "scope.dangerousCargoDescription")}
            >
              <TextInput
                placeholder="Descreva o tipo de carga perigosa"
                value={scope.dangerousCargoDescription ?? ""}
                onChange={(event) =>
                  updateScope({ dangerousCargoDescription: event.target.value })
                }
              />
            </Field>
          ) : null}
          <Field label="EX tarifário">
            <RadioGroup
              name="EX tarifário"
              value={scope.exTariff}
              onChange={(value) => updateScope({ exTariff: value })}
              options={yesNoConfirmOptions}
            />
          </Field>
        </Grid>
      </Section>
    </div>
  );
}

export default function TrackerScopeWizard() {
  const [form, setForm] = useState<TrackerProcessForm>(() => {
    if (typeof window === "undefined") return defaultTrackerProcessForm;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultTrackerProcessForm;

    try {
      return mergeForm(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return defaultTrackerProcessForm;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const stepFromUrl = searchParams.get("step");
  const currentStep = TRACKER_PROCESS_STEPS.includes(
    stepFromUrl as TrackerProcessStep,
  )
    ? (stepFromUrl as TrackerProcessStep)
    : TRACKER_PROCESS_STEPS[0];
  const currentIndex = TRACKER_PROCESS_STEPS.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TRACKER_PROCESS_STEPS.length - 1;

  const navigateToStep = useCallback(
    (step: TrackerProcessStep, method: "push" | "replace" = "push") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      const url = `${pathname}?${params.toString()}`;
      if (method === "replace") router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (
      !stepFromUrl ||
      !TRACKER_PROCESS_STEPS.includes(stepFromUrl as TrackerProcessStep)
    ) {
      navigateToStep(TRACKER_PROCESS_STEPS[0], "replace");
    }
  }, [navigateToStep, stepFromUrl]);

  const stepErrorEntries = useMemo(() => Object.values(errors), [errors]);

  function validateCurrentStep() {
    const result = validateTrackerStep(currentStep, form);
    setErrors(result.errors);
    return result.ok;
  }

  function goBack() {
    const previous = TRACKER_PROCESS_STEPS[currentIndex - 1];
    if (!previous) return;
    setErrors({});
    navigateToStep(previous);
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    const next = TRACKER_PROCESS_STEPS[currentIndex + 1];
    if (!next) return;
    setErrors({});
    navigateToStep(next);
  }

  async function submit() {
    const stepResult = validateTrackerStep(currentStep, form);
    if (!stepResult.ok) {
      setErrors(stepResult.errors);
      return;
    }

    const result = validateTrackerForm(form);
    setErrors(result.errors);
    if (!result.ok) return;

    setSubmitting(true);
    try {
      await importProcessesApi.createProcess(buildPayload(form));
      window.localStorage.removeItem(STORAGE_KEY);
      toast.success("Processo criado com sucesso.");
      router.replace("/tracker/pipeline");
    } catch {
      toast.error("Não foi possível criar o processo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full rounded-[2rem] border-border/80 p-4 shadow-sm sm:p-6 lg:p-8">
      <PageHeader
        title="Novo processo rastreado"
        subtitle="Preencha as etapas de identificação, operação e escopo para criar o processo no rastreador."
        right={
          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            Rascunho salvo no navegador
          </div>
        }
      />

      <StepPills
        steps={TRACKER_PROCESS_STEPS.map((step) => stepLabels[step])}
        currentIndex={currentIndex}
        onSelect={(index) => {
          const target = TRACKER_PROCESS_STEPS[index];
          if (!target || target === currentStep) return;
          if (index > currentIndex && !validateCurrentStep()) return;
          setErrors({});
          navigateToStep(target);
        }}
      />

      {stepErrorEntries.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <strong>Revise os campos destacados antes de prosseguir.</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {stepErrorEntries.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-6",
          submitting && "pointer-events-none opacity-70",
        )}
      >
        {currentStep === "IDENTIFICATION" ? (
          <ClientSearchStep form={form} setForm={setForm} errors={errors} />
        ) : null}
        {currentStep === "OPERATION" ? (
          <OperationStep form={form} setForm={setForm} errors={errors} />
        ) : null}
        {currentStep === "SCOPE" ? (
          <ScopeStep form={form} setForm={setForm} errors={errors} />
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <SecondaryButton
          type="button"
          onClick={goBack}
          disabled={isFirst || submitting}
        >
          Voltar
        </SecondaryButton>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!isLast ? (
            <PrimaryButton type="button" onClick={goNext} disabled={submitting}>
              Próxima etapa
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={submit} disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <RotateCw className="size-4 animate-spin" /> Salvando...
                </span>
              ) : (
                "Criar processo"
              )}
            </PrimaryButton>
          )}
        </div>
      </div>
    </Card>
  );
}
