"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";
import {
  EscopoSchema,
  ScopeStepCompanySchema,
  ScopeStepContactsSchema,
  ScopeStepOperationTypesSchema,
  ScopeStepImportOperationSchema,
  ScopeStepExportOperationSchema,
  ScopeStepTaxesSchema,
  ScopeStepServicesSchema,
  ScopeStepFinancialSchema,
} from "@/domain/scope/schema";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Checkbox, Field, NumberInput, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Divider, Grid, PageHeader, PrimaryButton, SecondaryButton, Stack, StepPills, Toolbar } from "@/components/ui/form-layout";

import {
  DESTINATION_LABEL,
  OPERATION_LABEL,
  PRICING_LABEL,
  SERVICE_LABEL,
  TAX_REGIME_LABEL,
  buildPreposto,
  buildServiceItem,
  emptyContact,
  emptyOperation,
  emptyOperationTaxes,
  emptyRefundBankAccount,
  joinLines,
  responsibleDepartment,
  responsibleName,
  splitLines,
  type OperationType,
  type ServiceType,
} from "./canonical-draft";
import { publicApi } from "@/lib/api/services/public";

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

const DESTINATIONS = [
  { value: "RESALE", label: "Revenda" },
  { value: "INDUSTRIALIZATION", label: "Industrialização" },
  { value: "USE_AND_CONSUMPTION", label: "Uso e consumo" },
  { value: "FIXED_ASSET", label: "Ativo imobilizado" },
];

type Props = {
  form: EscopoForm;
  setForm: Dispatch<SetStateAction<EscopoForm>>;
  responsaveis?: ScopeResponsible[];
  onSave?: (data: EscopoForm) => Promise<void> | void;
  onPublish?: (data: EscopoForm) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  status?: string;
};

function buildEtapas(data: EscopoForm): EtapaFormulario[] {
  const etapas: EtapaFormulario[] = ["COMPANY", "CONTACTS", "OPERATIONS"];

  if (data.operations.types.includes("IMPORT")) etapas.push("IMPORT");
  if (data.operations.types.includes("EXPORT")) etapas.push("EXPORT");

  etapas.push("TAXES", "SERVICES", "FINANCIAL");
  return etapas;
}

function zodErrorsToMap(error: any) {
  const map: Record<string, string> = {};
  for (const issue of error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    if (!map[path]) map[path] = issue.message;
  }
  return map;
}

function validateForm(data: EscopoForm) {
  const result = EscopoSchema.safeParse(data);
  if (result.success) return { ok: true, errors: {} as Record<string, string> };
  return { ok: false, errors: zodErrorsToMap(result.error) };
}

function validateStep(step: EtapaFormulario, data: EscopoForm) {
  const schemas: Record<EtapaFormulario, { safeParse: (value: unknown) => any }> = {
    COMPANY: ScopeStepCompanySchema,
    CONTACTS: ScopeStepContactsSchema,
    OPERATIONS: ScopeStepOperationTypesSchema,
    IMPORT: ScopeStepImportOperationSchema,
    EXPORT: ScopeStepExportOperationSchema,
    TAXES: ScopeStepTaxesSchema,
    SERVICES: ScopeStepServicesSchema,
    FINANCIAL: ScopeStepFinancialSchema,
  };

  const result = schemas[step].safeParse(data);
  if (result.success) return { ok: true, errors: {} as Record<string, string> };
  return { ok: false, errors: zodErrorsToMap(result.error) };
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

function boolFromSelect(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export default function ScopeWizard({
  form,
  setForm,
  responsaveis = [],
  onSave,
  onPublish,
  title = "Escopo",
  subtitle = "Edite, valide e publique o escopo.",
  status,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Não salvo");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const etapas = useMemo(() => buildEtapas(form), [form]);
  const stepFromUrl = searchParams.get("step") as EtapaFormulario | null;
  const etapaAtual = stepFromUrl && etapas.includes(stepFromUrl) ? stepFromUrl : etapas[0];
  const etapaAtualIndex = etapas.indexOf(etapaAtual);
  const isFirstStep = etapaAtualIndex === 0;
  const isLastStep = etapaAtualIndex === etapas.length - 1;

  const patchForm = useCallback(
    (patch: Partial<EscopoForm>) => setForm((current) => ({ ...current, ...patch })),
    [setForm],
  );

  const persist = useCallback(
    async (data: EscopoForm, silent = false) => {
      if (!onSave) return true;
      setSaving(true);
      try {
        await onSave(data);
        setSavedMessage(silent ? "Salvo automaticamente" : "Salvo");
        return true;
      } catch {
        setSavedMessage("Erro ao salvar");
        toast.error("Não foi possível salvar o rascunho.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onSave],
  );

  const navigateToStep = useCallback(
    (nextStep: EtapaFormulario, method: "push" | "replace" = "push") => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", nextStep);
      const url = `${pathname}?${q.toString()}`;
      if (method === "replace") router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams],
  );

  async function proximaEtapa() {
    const result = validateStep(etapaAtual, form);
    setErrors(result.errors);
    if (!result.ok) return;

    await persist(form, true);
    const nextStep = etapas[etapaAtualIndex + 1];
    if (nextStep) navigateToStep(nextStep);
  }

  function etapaAnterior() {
    const previousStep = etapas[etapaAtualIndex - 1];
    if (previousStep) navigateToStep(previousStep);
  }

  async function salvarRascunho() {
    await persist(form, false);
  }

  async function publicar() {
    const result = validateForm(form);
    setErrors(result.errors);
    if (!result.ok) {
      toast.error("Revise os campos obrigatórios antes de publicar.");
      return;
    }

    const ok = await persist(form, true);
    if (!ok) return;

    if (onPublish) {
      setSaving(true);
      try {
        await onPublish(form);
        setSavedMessage("Publicado");
        toast.success("Escopo publicado com sucesso.");
        router.refresh();
      } finally {
        setSaving(false);
      }
    }
  }

  function renderStep() {
    switch (etapaAtual) {
      case "COMPANY":
        return <CompanyStep form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "CONTACTS":
        return <ContactsStep form={form} patchForm={patchForm} errors={errors} />;
      case "OPERATIONS":
        return <OperationsStep form={form} patchForm={patchForm} errors={errors} />;
      case "IMPORT":
        return <OperationDetailStep operationType="IMPORT" form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "EXPORT":
        return <OperationDetailStep operationType="EXPORT" form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "TAXES":
        return <TaxesStep form={form} patchForm={patchForm} errors={errors} />;
      case "SERVICES":
        return <ServicesStep form={form} patchForm={patchForm} errors={errors} />;
      case "FINANCIAL":
        return <FinancialStep form={form} patchForm={patchForm} errors={errors} />;
      default:
        return null;
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title={title} subtitle={`${subtitle} ${status ? `• ${status}` : ""} • ${saving ? "Salvando..." : savedMessage}`} />

      <StepPills
        steps={etapas.map((etapa) => STEP_LABELS[etapa])}
        currentIndex={etapaAtualIndex}
        onSelect={(index) => navigateToStep(etapas[index])}
      />

      <div className="mb-5">{renderStep()}</div>

      {Object.keys(errors).length > 0 ? (
        <Card className="mb-5 border-destructive/40 bg-destructive/5">
          <div className="text-sm font-semibold text-destructive">Campos pendentes</div>
          <div className="mt-2 grid gap-1 text-sm text-destructive">
            {Object.entries(errors).slice(0, 8).map(([path, message]) => (
              <div key={path}>• {path}: {message}</div>
            ))}
          </div>
        </Card>
      ) : null}

      <Toolbar
        left={
          !isFirstStep ? (
            <SecondaryButton type="button" onClick={etapaAnterior} disabled={saving}>
              Anterior
            </SecondaryButton>
          ) : (
            <div />
          )
        }
        right={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={salvarRascunho} disabled={saving}>
              Salvar rascunho
            </SecondaryButton>

            {isLastStep ? (
              <PrimaryButton type="button" onClick={publicar} disabled={saving}>
                Publicar
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={proximaEtapa} disabled={saving}>
                Próximo
              </PrimaryButton>
            )}
          </div>
        }
      />
    </div>
  );
}

function CompanyStep({
  form,
  patchForm,
  errors,
  responsaveis,
}: {
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
  responsaveis: ScopeResponsible[];
}) {
  const company = form.company;
  const assignments = form.assignments;

  function patchCompany(patch: any) {
    patchForm({ company: { ...company, ...patch } } as Partial<EscopoForm>);
  }

  function patchAssignments(patch: any) {
    patchForm({ assignments: { ...assignments, ...patch } } as Partial<EscopoForm>);
  }

  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lastFetchedRef = useRef<string>("");

  useEffect(() => {
    async function lookup() {
      const taxId = company.taxId?.replace(/\D/g, "") ?? "";

      if (taxId.length !== 14 || lastFetchedRef.current === taxId) return;

      setLoadingCnpj(true);
      setLookupError(null);

      try {
        const data = await publicApi.lookupCompanyByCnpj(taxId);

        lastFetchedRef.current = taxId;

        const officeAddress = [
          data.logradouro,
          data.bairro,
          data.numero ? `n°${data.numero}` : null,
          data.municipio && data.uf ? `${data.municipio}/${data.uf}` : null,
          data.cep ? `CEP: ${data.cep}` : null,
        ]
          .filter(Boolean)
          .join(" - ");

        patchCompany({
          ...form.company,
          taxId,
          legalName: data.razao_social ?? form.company.legalName,
          tradeName: data.nome_fantasia ?? form.company.tradeName,
          stateRegistration:
            data.inscricaoEstadual ?? form.company.stateRegistration,
          municipalRegistration:
            data.inscricaoMunicipal ?? form.company.municipalRegistration,
          officeAddress: officeAddress || form.company.officeAddress,
          warehouseAddress: form.company.warehouseAddress,
          mainCnae: data.cnae_fiscal_descricao ?? form.company.mainCnae,
          secondaryCnae:
            data.cnaes_secundarios?.map((c) => `${c.codigo} - ${c.descricao}`).join("\n") ??
            form.company.secondaryCnae,
          taxRegime: data.regimeTributacao ?? form.company.taxRegime,
          radarMode: form.company.radarMode,
        });
      } catch {
        setLookupError(
          "Não foi possível consultar os dados públicos do CNPJ agora.",
        );
      } finally {
        setLoadingCnpj(false);
      }
    }

    void lookup();
  }, [company.taxId]);

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">Sobre a empresa</h3>
        <Grid columns={2}>
          <Field label="CNPJ" required error={fieldError(errors, "company.taxId")}
            hint={
              loadingCnpj
                ? "Consultando Receita Federal..."
                : (lookupError ??
                  "Ao concluir 14 dígitos, os dados serão buscados automaticamente.")
            }
          >
            <TextInput value={company.taxId ?? ""} onChange={(e) => patchCompany({ taxId: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="Razão social" required error={fieldError(errors, "company.legalName")}>
            <TextInput value={company.legalName ?? ""} onChange={(e) => patchCompany({ legalName: e.target.value })} />
          </Field>
          <Field label="Nome Resumido">
            <TextInput value={company.tradeName ?? ""} onChange={(e) => patchCompany({ tradeName: e.target.value })} />
          </Field>
          <Field label="Inscrição estadual">
            <TextInput value={company.stateRegistration ?? ""} onChange={(e) => patchCompany({ stateRegistration: e.target.value })} />
          </Field>
          <Field label="Inscrição municipal">
            <TextInput value={company.municipalRegistration ?? ""} onChange={(e) => patchCompany({ municipalRegistration: e.target.value })} />
          </Field>
          <Field label="Regime de tributação" required error={fieldError(errors, "company.taxRegime")}>
            <Select value={company.taxRegime ?? ""} onChange={(e) => patchCompany({ taxRegime: e.target.value })}>
              <option value="">Selecione</option>
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
              <option value="LUCRO_PRESUMIDO_OU_REAL">Lucro Presumido ou Real</option>
            </Select>
          </Field>
          <Field label="Modalidade RADAR" required error={fieldError(errors, "company.radarMode")}>
            <Select value={company.radarMode ?? ""} onChange={(e) => patchCompany({ radarMode: e.target.value })}>
              <option value="">Selecione</option>
              <option value="RADAR_INATIVO">Radar inativo</option>
              <option value="RADAR_LIMITADO_50K">Limitado 50k</option>
              <option value="RADAR_LIMITADO_150K">Limitado 150k</option>
              <option value="RADAR_ILIMITADO">Ilimitado</option>
            </Select>
          </Field>
          <Field label="CNAE principal" required error={fieldError(errors, "company.mainCnae")}>
            <TextInput value={company.mainCnae ?? ""} onChange={(e) => patchCompany({ mainCnae: e.target.value })} />
          </Field>
          <Field label="CNAEs secundários">
            <TextArea value={company.secondaryCnae ?? ""} onChange={(e) => patchCompany({ secondaryCnae: e.target.value })} />
          </Field>
          <Field label="Endereço do escritório" required error={fieldError(errors, "company.officeAddress")}>
            <TextArea value={company.officeAddress ?? ""} onChange={(e) => patchCompany({ officeAddress: e.target.value })} />
          </Field>
          <Field label="Endereço do armazém">
            <TextArea value={company.warehouseAddress ?? ""} onChange={(e) => patchCompany({ warehouseAddress: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Responsável comercial</h3>
        <UserSelect
          label="Responsável comercial"
          value={assignments.commercialResponsibleId ?? ""}
          onChange={(value) => patchAssignments({ commercialResponsibleId: value })}
          options={responsaveis}
          error={fieldError(errors, "assignments.commercialResponsibleId")}
        />
      </Card>
    </Stack>
  );
}

function ContactsStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const contacts = form.contacts ?? [];

  function update(index: number, patch: any) {
    const next = [...contacts];
    next[index] = { ...next[index], ...patch };
    patchForm({ contacts: next } as Partial<EscopoForm>);
  }

  function remove(index: number) {
    patchForm({ contacts: contacts.filter((_, current) => current !== index) } as Partial<EscopoForm>);
  }

  return (
    <Stack>
      <Toolbar
        left={<h3 className="text-base font-semibold">Contatos</h3>}
        right={<Button type="button" variant="outline" onClick={() => patchForm({ contacts: [...contacts, emptyContact(false)] } as Partial<EscopoForm>)}><Plus className="mr-2 h-4 w-4" />Adicionar contato</Button>}
      />
      {contacts.map((contact, index) => (
        <Card key={contact.id ?? index}>
          <Toolbar
            left={<Badge variant={contact.primary ? "default" : "secondary"}>Contato {index + 1}{contact.primary ? " • Principal" : ""}</Badge>}
            right={contacts.length > 1 ? <Button type="button" variant="outline" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button> : null}
          />
          <Grid columns={2}>
            <Field label="Nome" required error={fieldError(errors, `contacts.${index}.name`)}>
              <TextInput value={contact.name ?? ""} onChange={(e) => update(index, { name: e.target.value })} />
            </Field>
            <Field label="Cargo / departamento" required error={fieldError(errors, `contacts.${index}.departmentRole`)}>
              <TextInput value={contact.departmentRole ?? ""} onChange={(e) => update(index, { departmentRole: e.target.value })} />
            </Field>
            <Field label="E-mail" required error={fieldError(errors, `contacts.${index}.email`)}>
              <TextInput value={contact.email ?? ""} onChange={(e) => update(index, { email: e.target.value })} />
            </Field>
            <Field label="Telefone" required error={fieldError(errors, `contacts.${index}.phone`)}>
              <TextInput value={contact.phone ?? ""} onChange={(e) => update(index, { phone: e.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <TextInput value={contact.whatsapp ?? ""} onChange={(e) => update(index, { whatsapp: e.target.value })} />
            </Field>
            <div className="flex items-end gap-3 pb-2">
              <Checkbox label="Contato principal" checked={Boolean(contact.primary)} onChange={(checked) => update(index, { primary: checked })} />
              <Checkbox label="Ativo" checked={contact.active !== false} onChange={(checked) => update(index, { active: checked })} />
            </div>
          </Grid>
        </Card>
      ))}
    </Stack>
  );
}

function OperationsStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
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

function OperationDetailStep({
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

function TaxesStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const tabs = form.operations.types.length ? form.operations.types : ["IMPORT"];
  return (
    <Stack>
      {tabs.map((operationType) => {
        const key = operationType === "IMPORT" ? "importTaxes" : "exportTaxes";
        const taxes = (form.taxes as any)[key] ?? emptyOperationTaxes();
        const federal = taxes.federalTaxes ?? emptyOperationTaxes().federalTaxes;
        const afrmm = taxes.afrmm ?? emptyOperationTaxes().afrmm;
        const icms = taxes.icms ?? emptyOperationTaxes().icms;

        function patchTaxes(patch: any) {
          patchForm({ taxes: { ...form.taxes, [key]: { ...taxes, ...patch } } } as Partial<EscopoForm>);
        }

        return (
          <Card key={operationType}>
            <h3 className="text-base font-semibold">Impostos - {OPERATION_LABEL[operationType as OperationType]}</h3>
            <Grid columns={2}>
              <Field label="Conta impostos federais">
                <AccountOwnerSelect value={federal.paymentAccountType} onChange={(paymentAccountType) => patchTaxes({ federalTaxes: { ...federal, paymentAccountType } })} />
              </Field>
              <Field label="Observação impostos federais">
                <TextInput value={federal.notes ?? ""} onChange={(e) => patchTaxes({ federalTaxes: { ...federal, notes: e.target.value } })} />
              </Field>
              {(["ii", "ipi", "pis", "cofins"] as const).map((tax) => {
                const regimeKey = `${tax}Regime`;
                const benefitKey = `${tax}BenefitDetail`;
                return (
                  <div key={tax} className="rounded-xl border p-3">
                    <Field label={tax.toUpperCase()}>
                      <TaxRegimeSelect value={(federal as any)[regimeKey]} onChange={(value) => patchTaxes({ federalTaxes: { ...federal, [regimeKey]: value } })} />
                    </Field>
                    <Field label={`Benefício ${tax.toUpperCase()}`}>
                      <TextInput value={(federal as any)[benefitKey] ?? ""} onChange={(e) => patchTaxes({ federalTaxes: { ...federal, [benefitKey]: e.target.value } })} />
                    </Field>
                  </div>
                );
              })}
              <Field label="Regime AFRMM">
                <TaxRegimeSelect value={afrmm.regime} onChange={(regime) => patchTaxes({ afrmm: { ...afrmm, regime } })} />
              </Field>
              <Field label="Detalhe benefício AFRMM">
                <TextInput value={afrmm.benefitDetail ?? ""} onChange={(e) => patchTaxes({ afrmm: { ...afrmm, benefitDetail: e.target.value } })} />
              </Field>
              <Field label="Regime ICMS">
                <TaxRegimeSelect value={icms.regime} onChange={(regime) => patchTaxes({ icms: { ...icms, regime } })} />
              </Field>
              <Field label="Observação ICMS">
                <TextInput value={icms.notes ?? ""} onChange={(e) => patchTaxes({ icms: { ...icms, notes: e.target.value } })} />
              </Field>
            </Grid>
            {fieldError(errors, `taxes.${key}`) ? <p className="mt-2 text-sm text-destructive">{fieldError(errors, `taxes.${key}`)}</p> : null}
          </Card>
        );
      })}
    </Stack>
  );
}

function ServicesStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
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

function FinancialStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const financial = form.financial;

  function patchFinancial(patch: any) {
    patchForm({ financial: { ...financial, ...patch } } as Partial<EscopoForm>);
  }

  function updateAccount(index: number, patch: any) {
    const refundBankAccounts = [...(financial.refundBankAccounts ?? [])];
    refundBankAccounts[index] = { ...refundBankAccounts[index], ...patch };
    patchFinancial({ refundBankAccounts });
  }

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">Financeiro</h3>
        <Grid columns={2}>
          <Field label="Preferência de pagamento" error={fieldError(errors, "financial.paymentPreference")}>
            <Select value={financial.paymentPreference ?? ""} onChange={(e) => patchFinancial({ paymentPreference: e.target.value })}>
              <option value="BANK_TRANSFER">Transferência bancária</option>
              <option value="PIX">PIX</option>
              <option value="BANK_SLIP">Boleto</option>
              <option value="OTHER">Outro</option>
            </Select>
          </Field>
          <Field label="Chave PIX" error={fieldError(errors, "financial.refundPixKey")}>
            <TextInput value={financial.refundPixKey ?? ""} onChange={(e) => patchFinancial({ refundPixKey: e.target.value })} />
          </Field>
          <Field label="Observações financeiras">
            <TextArea value={financial.notes ?? ""} onChange={(e) => patchFinancial({ notes: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      <Card>
        <Toolbar
          left={<h3 className="text-base font-semibold">Contas bancárias para devolução</h3>}
          right={<Button type="button" variant="outline" onClick={() => patchFinancial({ refundBankAccounts: [...(financial.refundBankAccounts ?? []), emptyRefundBankAccount()] })}><Plus className="mr-2 h-4 w-4" />Adicionar conta</Button>}
        />
        <Stack>
          {(financial.refundBankAccounts ?? []).map((account, index) => (
            <Grid columns={2} key={account.id ?? index}>
              <Field label="Banco">
                <TextInput value={account.bankName ?? ""} onChange={(e) => updateAccount(index, { bankName: e.target.value })} />
              </Field>
              <Field label="Agência">
                <TextInput value={account.branch ?? ""} onChange={(e) => updateAccount(index, { branch: e.target.value })} />
              </Field>
              <Field label="Conta">
                <TextInput value={account.account ?? ""} onChange={(e) => updateAccount(index, { account: e.target.value })} />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => patchFinancial({ refundBankAccounts: financial.refundBankAccounts.filter((_: any, i: number) => i !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Grid>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

function UserSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: ScopeResponsible[]; error?: string }) {
  return (
    <Field label={label} required error={error}>
      <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {options.map((user: any) => (
          <option key={user.id} value={user.id}>
            {responsibleName(user)}{responsibleDepartment(user) ? ` • ${responsibleDepartment(user)}` : ""}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function UserMultiSelect({ label, value, onChange, options, error }: { label: string; value: string[]; onChange: (value: string[]) => void; options: ScopeResponsible[]; error?: string }) {
  const selected = new Set(value ?? []);
  return (
    <div className="space-y-2">
      <Field label={label} error={error}>
        <Select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onChange(Array.from(new Set([...(value ?? []), e.target.value])));
          }}
        >
          <option value="">Adicionar responsável</option>
          {options.map((user: any) => (
            <option key={user.id} value={user.id} disabled={selected.has(user.id)}>
              {responsibleName(user)}{responsibleDepartment(user) ? ` • ${responsibleDepartment(user)}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap gap-2">
        {(value ?? []).map((id) => {
          const user = options.find((item: any) => item.id === id) as any;
          return (
            <Badge key={id} variant="secondary" className="gap-2">
              {responsibleName(user) || id}
              <button type="button" onClick={() => onChange(value.filter((item) => item !== id))}>×</button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
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

function AccountOwnerSelect({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return (
    <Select value={value ?? "CASCO"} onChange={(e) => onChange(e.target.value)}>
      <option value="CASCO">Conta CASCO</option>
      <option value="CLIENT">Conta do cliente</option>
    </Select>
  );
}

function TaxRegimeSelect({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return (
    <Select value={value ?? "FULL"} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(TAX_REGIME_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </Select>
  );
}
