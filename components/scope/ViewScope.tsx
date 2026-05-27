"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { useOrganizationSettingsByKey } from "@/lib/api/hooks/use-dashboards";
import type { ScopeDetailResponse } from "@/lib/api/types/scope-api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { formatCNPJ } from "@/utils/format";
import { accountCasco, bool, currency, date, label, list, percent, refundAccount, taxAccount, text } from "@/utils/functions";
import { ACCOUNT_OWNER_LABEL, DESTINATION_PURPOSE_LABEL, FREIGHT_MODE_LABEL, OPERATION_TYPE_LABEL, PAYMENT_PREFERENCE_LABEL, PRICING_REFERENCE_LABEL, PRICING_TYPE_LABEL, SERVICE_DETAIL_TYPE_LABEL, SERVICE_TYPE_LABEL, TAX_REGIME_COMPANY_LABEL, TAX_REGIME_LABEL } from "@/utils/mapTypes";

const hiredBadge = (
  <Badge className="bg-emerald-600 hover:bg-emerald-600">
    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
    Contrata
  </Badge>
);

function Field({
  label,
  value,
  previewChars = 180,
}: {
  label: string;
  value: React.ReactNode | null;
  previewChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (value == null || value === false || value === "") return null;

  const isPlainText = typeof value === "string" || typeof value === "number";
  const rawText = isPlainText ? String(value) : null;
  const shouldCollapse = Boolean(rawText && rawText.length > previewChars);
  const visibleText =
    shouldCollapse && !expanded
      ? `${rawText?.slice(0, previewChars).trimEnd()}...`
      : rawText;

  return (
    <div className="inline-block w-full break-inside-avoid rounded-xl border bg-background p-3 align-top shadow-sm">
      {label ? (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      ) : null}

      <div className="text-sm font-medium whitespace-pre-line wrap-break-word text-wrap">
        {isPlainText ? visibleText : value}
      </div>

      {shouldCollapse ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto p-0 text-xs font-semibold print:hidden"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </Button>
      ) : null}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function ViewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 md:p-5">
      <h4 className="mb-4 text-sm font-semibold">{title}</h4>
      <div className="grid gap-4">{children}</div>
    </Card>
  );
}

function OperationView({
  title,
  operation,
  daAnalysts,
  aeAnalysts,
}: {
  title: string;
  operation: ScopeDetailResponse["operations"]["importOperation"];
  daAnalysts?: Array<{ id: string; name: string; email?: string | null }>;
  aeAnalysts?: Array<{ id: string; name: string; email?: string | null }>;
}) {

  if (!operation) return null;

  return (
    <>
      <Separator className="my-2" />

      <h5 className="text-sm font-semibold">{title}</h5>

      <Grid>

        <Field
          label="Analistas DA"
          value={list(daAnalysts?.map((user) => user.name))}
        />

        <Field
          label="Analistas AE"
          value={list(aeAnalysts?.map((user) => user.name))}
        />

        <Field
          label="Produtos importados"
          value={text(operation.productsDescription)}
        />

        <Field
          label="Vínculo com exportador"
          value={bool(operation.hasExporterRelationship)}
        />

        <Field
          label="Necessidade de DTA"
          value={bool(operation.requiresDta)}
        />

        <Field
          label="Necessidade de DTC"
          value={bool(operation.requiresDtc)}
        />

        <Field
          label="Necessidade de LI/LPCO"
          value={bool(operation.requiresLiLpco)}
        />

        <Field
          label="Órgão anuente complementar"
          value={text(operation.otherAuthority)}
        />

        <Field label="Observações de NCM" value={text(operation.ncmNotes)} />

        <Field
          label="NCMs"
          value={list(
            operation.ncms?.map((ncm) =>
              [ncm.code, ncm.description].filter(Boolean).join(" - "),
            ),
          )}
        />

        <Field
          label="Locais de entrada"
          value={list(
            operation.entryLocations?.map((location) =>
              [location.code, location.name].filter(Boolean).join(" - "),
            ),
          )}
        />

        <Field
          label="Locais de desembaraço"
          value={list(
            operation.customsClearanceLocations?.map((location) =>
              [location.code, location.name].filter(Boolean).join(" - "),
            ),
          )}
        />

        <Field
          label="Órgãos anuentes"
          value={list(
            operation.authorities?.map((authority) =>
              [authority.code, authority.name].filter(Boolean).join(" - "),
            ),
          )}
        />

        <Field
          label="Destinação"
          value={list(
            operation.destinationPurposes?.map((item) =>
              [
                label(DESTINATION_PURPOSE_LABEL, item.purpose),
                item.consumptionSubtype,
              ]
                .filter(Boolean)
                .join(" - "),
            ),
          )}
        />
      </Grid>
    </>
  );
}

function TaxesView({
  title,
  taxes,
}: {
  title: string;
  taxes: ScopeDetailResponse["taxes"]["importTaxes"];
}) {

  if (!taxes) return null;

  const hasFederalTaxes = Boolean(taxes.federalTaxes);
  const hasAfrmm = Boolean(taxes.afrmm);
  const hasIcms = Boolean(taxes.icms);

  if (!hasFederalTaxes && !hasAfrmm && !hasIcms) {
    return (
      <ViewCard title={title}>
        <p className="text-sm text-muted-foreground">
          Nenhuma informação tributária cadastrada.
        </p>
      </ViewCard>
    );
  }

  return (
    <ViewCard title={title}>
      {hasFederalTaxes ? (
        <>
          <h5 className="text-sm font-semibold">Impostos federais</h5>

          <Grid>
            <Field
              label="Conta para pagamento"
              value={label(
                ACCOUNT_OWNER_LABEL,
                taxes.federalTaxes?.paymentAccountType,
              )}
            />
            <Field label="Dados bancários" value={taxAccount(taxes.federalTaxes)} />
            <Field
              label="II"
              value={label(TAX_REGIME_LABEL, taxes.federalTaxes?.iiRegime)}
            />
            <Field
              label="Benefício II"
              value={text(taxes.federalTaxes?.iiBenefitDetail)}
            />
            <Field
              label="IPI"
              value={label(TAX_REGIME_LABEL, taxes.federalTaxes?.ipiRegime)}
            />
            <Field
              label="Benefício IPI"
              value={text(taxes.federalTaxes?.ipiBenefitDetail)}
            />
            <Field
              label="PIS"
              value={label(TAX_REGIME_LABEL, taxes.federalTaxes?.pisRegime)}
            />
            <Field
              label="Benefício PIS"
              value={text(taxes.federalTaxes?.pisBenefitDetail)}
            />
            <Field
              label="COFINS"
              value={label(TAX_REGIME_LABEL, taxes.federalTaxes?.cofinsRegime)}
            />
            <Field
              label="Benefício COFINS"
              value={text(taxes.federalTaxes?.cofinsBenefitDetail)}
            />
            <Field label="Observações" value={text(taxes.federalTaxes?.notes)} />
          </Grid>
        </>
      ) : null}

      {hasAfrmm ? (
        <>
          <Separator className="my-2" />

          <h5 className="text-sm font-semibold">AFRMM</h5>

          <Grid>
            <Field
              label="Conta para pagamento"
              value={label(ACCOUNT_OWNER_LABEL, taxes.afrmm?.paymentAccountType)}
            />
            <Field label="Dados bancários" value={taxAccount(taxes.afrmm)} />
            <Field
              label="Regime"
              value={label(TAX_REGIME_LABEL, taxes.afrmm?.regime)}
            />
            <Field label="Benefício" value={text(taxes.afrmm?.benefitDetail)} />
            <Field label="Observações" value={text(taxes.afrmm?.notes)} />
          </Grid>
        </>
      ) : null}

      {hasIcms ? (
        <>
          <Separator className="my-2" />

          <h5 className="text-sm font-semibold">ICMS</h5>

          <Grid>
            <Field
              label="Conta para pagamento"
              value={label(ACCOUNT_OWNER_LABEL, taxes.icms?.paymentAccountType)}
            />
            <Field label="Dados bancários" value={taxAccount(taxes.icms)} />
            <Field
              label="Regime"
              value={label(TAX_REGIME_LABEL, taxes.icms?.regime)}
            />
            <Field
              label="Alíquota recolhida"
              value={percent(taxes.icms?.collectedRate)}
            />
            <Field
              label="Alíquota efetiva"
              value={percent(taxes.icms?.effectiveRate)}
            />
            <Field label="Observações" value={text(taxes.icms?.notes)} />
          </Grid>

          {taxes.icms?.destinationRates?.length ? (
            <div className="grid gap-3">
              {taxes.icms.destinationRates.map((rate) => (
                <Card key={rate.id} className="gap-3 p-3">
                  <h6 className="text-sm font-semibold">
                    {label(DESTINATION_PURPOSE_LABEL, rate.destinationPurpose)}
                  </h6>

                  <Grid>
                    <Field
                      label="Alíquota recolhida"
                      value={percent(rate.collectedRate)}
                    />
                    <Field
                      label="Alíquota efetiva"
                      value={percent(rate.effectiveRate)}
                    />
                    <Field label="Observações" value={text(rate.notes)} />
                  </Grid>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </ViewCard>
  );
}

function ServiceDetailsView({
  details,
}: {
  details: ScopeDetailResponse["services"]["items"][number]["details"];
}) {
  if (!details) return null;

  if (details.type === "CUSTOMS_BROKER") {
    return (
      <>
        <Field
          label="Tipo de detalhe"
          value={label(SERVICE_DETAIL_TYPE_LABEL, details.type)}
        />
        <Field
          label="Referência de cobrança"
          value={
            label(PRICING_REFERENCE_LABEL, details.pricingReference) ??
            text(details.pricingReference)
          }
        />
        <Field
          label="Multiplicador salário mínimo"
          value={text(details.salaryMultiplier)}
        />
      </>
    );
  }

  if (details.type === "FREIGHT") {
    return (
      <>
        <Field
          label="Tipo de detalhe"
          value={label(SERVICE_DETAIL_TYPE_LABEL, details.type)}
        />
        <Field
          label="Modalidade"
          value={label(FREIGHT_MODE_LABEL, details.mode) ?? text(details.mode)}
        />
        <Field label="PTAX negociada" value={percent(details.negotiatedPtax)} />
        <Field label="Observações gerais" value={text(details.generalNotes)} />
      </>
    );
  }

  if (details.type === "INSURANCE") {
    return (
      <>
        <Field
          label="Tipo de detalhe"
          value={label(SERVICE_DETAIL_TYPE_LABEL, details.type)}
        />
        <Field label="Valor mínimo" value={currency(details.minimumAmount)} />
        <Field
          label="Percentual sobre CFR"
          value={percent(details.cfrPercentage)}
        />
        <Field
          label="Data de inclusão da apólice"
          value={date(details.policyInclusionDate)}
        />
        <Field
          label="Descrição complementar"
          value={text(details.additionalDescription)}
        />
      </>
    );
  }

  if (details.type === "CERTIFICATE") {
    return (
      <>
        <Field
          label="Tipo de detalhe"
          value={label(SERVICE_DETAIL_TYPE_LABEL, details.type)}
        />
        <Field label="Nome do certificado" value={text(details.certificateName)} />
        <Field label="Órgão emissor" value={text(details.issuingAuthority)} />
        <Field label="Observações" value={text(details.notes)} />
      </>
    );
  }

  return null;
}

function ServicesView({
  title,
  services,
  prepostos,
}: {
  title: string;
  services: ScopeDetailResponse["services"]["items"];
  prepostos: ScopeDetailResponse["services"]["prepostos"];
}) {
  if (!services.length && !prepostos.length) {
    return (
      <ViewCard title={title}>
        <p className="text-sm text-muted-foreground">Nenhum serviço contratado.</p>
      </ViewCard>
    );
  }

  return (
    <ViewCard title={title}>
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className="p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-sm font-semibold">
                  {label(SERVICE_TYPE_LABEL, service.serviceType) ??
                    service.name ??
                    "Serviço"}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {label(OPERATION_TYPE_LABEL, service.operationType)}
                </p>
              </div>

              {service.enabled ? hiredBadge : null}
            </div>

            <Grid>
              <Field
                label="Tipo de cobrança"
                value={label(PRICING_TYPE_LABEL, service.pricingType)}
              />
              <Field label="Valor" value={text(service.amount)} />
              <Field label="Moeda" value={text(service.currency)} />
              <Field label="Responsável" value={text(service.responsibleUser?.name)} />
              <Field label="Última atualização" value={date(service.lastUpdatedOn)} />
              <Field label="Observações" value={text(service.notes)} />

              <ServiceDetailsView details={service.details} />
            </Grid>
          </Card>
        ))}

        {prepostos.map((preposto) => (
          <Card key={preposto.id} className="p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-sm font-semibold">Preposto</h5>
                <p className="text-xs text-muted-foreground">
                  {label(OPERATION_TYPE_LABEL, preposto.operationType)}
                </p>
              </div>

              {preposto.enabled ? hiredBadge : null}
            </div>

            <Grid>
              <Field label="Preposto selecionado" value={text(preposto.prepostoName)} />
              <Field label="Preposto manual" value={text(preposto.manualPrepostoName)} />
              <Field
                label="Observações do preposto manual"
                value={text(preposto.manualPrepostoNotes)}
              />
              <Field label="Valor" value={currency(preposto.amount)} />
              <Field
                label="Incluso no desembaraço CASCO"
                value={bool(preposto.includedInCascoCustomsClearance)}
              />
              <Field label="Outro porto" value={text(preposto.otherPort)} />
              <Field label="Outra fronteira" value={text(preposto.otherBorder)} />
              <Field
                label="Cidades"
                value={list(
                  preposto.cities?.map((city) =>
                    [city.city, city.state].filter(Boolean).join(" / "),
                  ),
                )}
              />
              <Field label="Observações" value={text(preposto.notes)} />
            </Grid>
          </Card>
        ))}
      </div>
    </ViewCard>
  );
}

export default function ViewScope({
  scope,
  versionLabel,
}: {
  scope: ScopeDetailResponse;
  versionLabel: string;
}) {
  const importServices =
    scope.services?.items?.filter((service) => service.operationType === "IMPORT") ??
    [];

  const exportServices =
    scope.services?.items?.filter((service) => service.operationType === "EXPORT") ??
    [];

  const importPrepostos =
    scope.services?.prepostos?.filter(
      (preposto) => preposto.operationType === "IMPORT",
    ) ?? [];

  const exportPrepostos =
    scope.services?.prepostos?.filter(
      (preposto) => preposto.operationType === "EXPORT",
    ) ?? [];

  const { data: salarioMinimoData } = useOrganizationSettingsByKey(
    "salario_minimo_vigente",
  );

  const { data: ctaBancariaData } = useOrganizationSettingsByKey(
    "dados_bancarios_casco",
  );

  const salarioMinimo = salarioMinimoData?.valor;
  const ctaBancariaCasco = ctaBancariaData ?? {};

  return (
    <Card className="p-4 md:p-6 print-avoid-break">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Resumo do escopo</h2>
          <p className="text-sm text-muted-foreground">
            Visualização consolidada dos dados cadastrados.
          </p>
        </div>

        <Badge>{versionLabel}</Badge>
      </div>

      <div className="grid gap-6">
        <ViewCard title="Informações fixas">
          <Grid>
            <Field
              label="Salário mínimo vigente"
              value={currency(salarioMinimo ?? 0)}
            />
            <Field
              label="Dados bancários CASCO"
              value={accountCasco(ctaBancariaCasco)}
            />
          </Grid>
        </ViewCard>

        <ViewCard title="Sobre a empresa">
          <Grid>
            <Field label="Razão social" value={text(scope.company?.legalName)} />
            <Field label="Nome Resumido" value={text(scope.company?.tradeName)} />
            <Field label="CNPJ" value={formatCNPJ(scope.company?.taxId ?? "")} />
            <Field
              label="Inscrição estadual"
              value={text(scope.company?.stateRegistration)}
            />
            <Field
              label="Inscrição municipal"
              value={text(scope.company?.municipalRegistration)}
            />
            <Field
              label="Endereço completo do escritório"
              value={text(scope.company?.officeAddress)}
            />
            <Field
              label="Endereço completo do armazém"
              value={text(scope.company?.warehouseAddress)}
            />
            <Field label="CNAE principal" value={text(scope.company?.mainCnae)} />
            <Field
              label="CNAEs secundários"
              value={text(scope.company?.secondaryCnae)}
            />
            <Field
              label="Regime de tributação"
              value={label(TAX_REGIME_COMPANY_LABEL, scope.company?.taxRegime)}
            />
            <Field label="Modalidade RADAR" value={text(scope.company?.radarMode)} />
            <Field
              label="Responsável comercial"
              value={text(scope.assignments?.commercialResponsible?.name)}
            />
          </Grid>
        </ViewCard>

        <ViewCard title="Contatos">
          {scope.contacts?.length ? (
            <div className="grid gap-3">
              {scope.contacts.map((contact, index) => (
                <Grid key={contact.id ?? index}>
                  <Field label={`Contato ${index + 1} • Nome`} value={text(contact.name)} />
                  <Field label="E-mail" value={text(contact.email)} />
                  <Field
                    label="Cargo / departamento"
                    value={text(contact.departmentRole)}
                  />
                  <Field label="Telefone" value={text(contact.phone)} />
                  <Field label="WhatsApp" value={text(contact.whatsapp)} />
                </Grid>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
          )}
        </ViewCard>

        <ViewCard title="Operação">

          <OperationView
            title="Importação"
            operation={scope.operations?.importOperation}
            daAnalysts={scope.assignments?.importDaAnalysts}
            aeAnalysts={scope.assignments?.importAeAnalysts}
          />

          <OperationView
            title="Exportação"
            operation={scope.operations?.exportOperation}
            daAnalysts={scope.assignments?.exportDaAnalysts}
            aeAnalysts={scope.assignments?.exportAeAnalysts}
          />
        </ViewCard>

        <TaxesView title="Impostos de importação" taxes={scope.taxes?.importTaxes} />

        <TaxesView title="Impostos de exportação" taxes={scope.taxes?.exportTaxes} />

        <ServicesView
          title="Serviços de importação"
          services={importServices}
          prepostos={importPrepostos}
        />

        <ServicesView
          title="Serviços de exportação"
          services={exportServices}
          prepostos={exportPrepostos}
        />

        <ViewCard title="Financeiro">
          <Grid>
            <Field
              label="Preferência de pagamento"
              value={label(PAYMENT_PREFERENCE_LABEL, scope.financial?.paymentPreference)}
            />

            <Field
              label="Chave PIX para devolução de saldo"
              value={text(scope.financial?.refundPixKey)}
            />

            <Field
              label="Dados bancários para devolução de saldo"
              value={list(
                scope.financial?.refundBankAccounts
                  ?.map((account) => refundAccount(account))
                  .filter(Boolean) as string[],
              )}
            />

            <Field label="Observações financeiras" value={text(scope.financial?.notes)} />
          </Grid>
        </ViewCard>

        <ViewCard title="Informações gerais">
          <Field label="" value={text(scope.general?.description)} />
        </ViewCard>
      </div>
    </Card>
  );
}