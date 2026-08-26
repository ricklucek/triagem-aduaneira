"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Info, RotateCw, X } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";
import { LOCAIS } from "@/components/scope/StepImportacao";
import { useScope, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ } from "@/utils/format";
import { ResponsibleShow } from "@/components/ResponsibleShow";
import { useOrganizationSettingsByKey } from "@/lib/api/hooks/use-dashboards";
import { ScopeViewTabs } from "./view/ScopeViewTabs";
import { HighlightField } from "./view/HighlightField";
import { TaxRegimeStatus } from "./view/TaxRegimeStatus";

const text = (v: unknown) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0)
    ? null
    : String(v);

const currency = (v?: number | null) =>
  v == null || Number.isNaN(v)
    ? null
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

const date = (v?: string | null) => {
  if (!v) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!match) return v;

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
};

const list = (v?: Array<string | number | null> | null) =>
  !v?.length ? null : v.filter(Boolean).join(", ");

const queryList = (v?: Array<string | number | null> | null) =>
  !v?.length ? "" : v.filter(Boolean).map(String).join(",");

function citiesFromSelectedImportLocais(selected?: string[] | null) {
  if (!selected?.length) return [];

  const selectedValues = new Set(selected);

  return Array.from(
    new Set(
      LOCAIS.filter((local) => selectedValues.has(local.value)).flatMap(
        (local) => local.cities,
      ),
    ),
  );
}

function importPrepostoCities(
  importacao?: EscopoForm["operacao"]["importacao"],
) {
  const cidadesDesembaraco = importacao?.cidadesLocaisDesembaraco ?? [];
  if (cidadesDesembaraco.length > 0) return cidadesDesembaraco;

  const cidadesEntrada = importacao?.cidadesLocaisEntrada ?? [];
  if (cidadesEntrada.length > 0) return cidadesEntrada;

  const cidadesDerivadasDesembaraco = citiesFromSelectedImportLocais(
    importacao?.locaisDesembaraco,
  );
  if (cidadesDerivadasDesembaraco.length > 0)
    return cidadesDerivadasDesembaraco;

  return citiesFromSelectedImportLocais(importacao?.locaisEntrada);
}

const account = (
  v?: {
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  } | null,
) =>
  !v || (!v.banco && !v.agencia && !v.conta)
    ? null
    : `Banco: ${text(v.banco)} • Agência: ${text(v.agencia)} • Conta: ${text(
        v.conta,
      )}`;

const contaPagamentoLabel = (v?: string | null) => {
  if (v === "CASCO") return "CASCO";
  if (v === "CLIENTE") return "Cliente";
  return text(v);
};

const shouldShowClientAccount = (contaPagamento?: string | null) =>
  contaPagamento === "CLIENTE";

const freightResponsibleLabel = (value?: string | null) => {
  if (!value || value === "CASCO") return "CASCO";
  if (value === "TERCEIRO") return "Empresa terceira";
  if (value === "CASO_A_CASO") return "Caso a caso";
  return value;
};

const ICMS_DESTINACAO_LABEL: Record<string, string> = {
  REVENDA: "Revenda",
  INDUSTRIALIZACAO: "Industrialização",
  USO_E_CONSUMO: "Uso e consumo",
  ATIVO_IMOBILIZADO: "Ativo imobilizado",
};

const MODAL_LOCAL_LABEL: Record<string, string> = {
  AEREO: "Aéreo",
  MARITIMO: "Marítimo",
  RODOVIARIO: "Rodoviário",
};

const modalLocalList = (v?: Array<string | null> | null) =>
  !v?.length
    ? null
    : v
        .filter((modal): modal is string => Boolean(modal))
        .map((modal) => MODAL_LOCAL_LABEL[modal] ?? modal)
        .join(", ");

const HiredBadge = ({
  value,
}: {
  value: "SIM" | "NAO" | "CASO_A_CASO" | undefined;
}) => {
  if (value == "SIM") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Contrata
      </Badge>
    );
  } else if (value == "NAO") {
    return (
      <Badge className="bg-red-600 hover:bg-red-600">
        <X className="mr-1 h-3.5 w-3.5" />
        Não Contrata
      </Badge>
    );
  } else if (value == "CASO_A_CASO") {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-500">
        <Info className="mr-1 h-3.5 w-3.5" />
        Caso a Caso
      </Badge>
    );
  }

  return;
};

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

  const border =
    rawText === "SIM"
      ? "border-emerald-300"
      : rawText === "NAO"
        ? "border-red-300"
        : "border-border";

  return (
    <div
      className={`inline-block w-full break-inside-avoid rounded-xl border bg-background ${border} p-3 align-top shadow-sm`}
    >
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

function PasswordField({ password }: { password?: string | null }) {
  const [visible, setVisible] = useState(false);

  if (!password) return null;

  return (
    <Field
      label="Senha"
      value={
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 break-all font-mono">
            {visible ? password : "••••••••"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 print:hidden"
            aria-label={visible ? "Ocultar senha" : "Revelar senha"}
            title={visible ? "Ocultar senha" : "Revelar senha"}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
      }
    />
  );
}

type ThirdPartyFreightProvider = {
  empresa?: string | null;
  nomeSistema?: string | null;
  url?: string | null;
  login?: string | null;
  senha?: string | null;
  contato?: string | null;
  observacoes?: string | null;
};

function ThirdPartyFreightProvidersView({
  providers,
}: {
  providers?: ThirdPartyFreightProvider[] | null;
}) {
  if (!providers?.length) {
    return (
      <div className="md:col-span-2">
        <Field
          label="Prestadores terceiros"
          value="Nenhum prestador cadastrado"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:col-span-2">
      {providers.map((provider, index) => (
        <Card key={index} className="gap-3 border-border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-semibold">
              Prestador {index + 1}
              {provider.empresa ? ` · ${provider.empresa}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Credenciais do sistema de frete internacional
            </p>
          </div>

          <Grid>
            <Field label="Empresa" value={text(provider.empresa)} />
            <Field label="Sistema" value={text(provider.nomeSistema)} />
            <Field
              label="URL"
              value={
                provider.url ? (
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline underline-offset-2"
                  >
                    {provider.url}
                  </a>
                ) : null
              }
            />
            <Field label="Contato" value={text(provider.contato)} />
            <Field label="Login" value={text(provider.login)} />
            <PasswordField password={provider.senha} />
            <div className="md:col-span-2">
              <HighlightField
                label="Observações"
                value={text(provider.observacoes)}
              />
            </div>
          </Grid>
        </Card>
      ))}
    </div>
  );
}

function TitleField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null;
}) {
  if (!value) return null;

  return (
    <div className="w-full col-span-2 flex flex-col gap-2">
      <div className="p-3 flex flex-row items-center gap-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium wrap-break-word whitespace-pre-line text-wrap">
          {value}
        </div>
      </div>
      <Separator />
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

function PaymentAccountFields({
  contaPagamento,
  dadosContaCliente,
  subject,
}: {
  contaPagamento?: string | null;
  dadosContaCliente?: {
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  } | null;
  subject: string;
}) {
  return (
    <>
      <Field
        label={`Conta para pagamento ${subject}`}
        value={contaPagamentoLabel(contaPagamento)}
      />

      {shouldShowClientAccount(contaPagamento) ? (
        <Field
          label={`Dados bancários do cliente ${subject}`}
          value={account(dadosContaCliente)}
        />
      ) : null}

      {contaPagamento === "CASCO" ? (
        <Field label={`Responsável pelo pagamento ${subject}`} value="CASCO" />
      ) : null}
    </>
  );
}

function FederalTaxItem({
  title,
  tax,
}: {
  title: string;
  tax?: {
    regime?: string | null;
    detalheBeneficio?: string | null;
  } | null;
}) {
  if (!tax) return null;

  return (
    <Card className="gap-3 p-3">
      <h6 className="text-sm font-semibold">{title}</h6>
      <TaxRegimeStatus
        regime={tax.regime}
        description={text(tax.detalheBeneficio)}
      />
    </Card>
  );
}

function FederalTaxesView({
  impostosFederais,
}: {
  impostosFederais?: {
    contaPagamento?: string | null;
    dadosContaCliente?: {
      banco?: string | null;
      agencia?: string | null;
      conta?: string | null;
    } | null;
    ii?: {
      regime?: string | null;
      detalheBeneficio?: string | null;
    } | null;
    ipi?: {
      regime?: string | null;
      detalheBeneficio?: string | null;
    } | null;
    pis?: {
      regime?: string | null;
      detalheBeneficio?: string | null;
    } | null;
    cofins?: {
      regime?: string | null;
      detalheBeneficio?: string | null;
    } | null;
    observacao?: string | null;
  } | null;
}) {
  if (!impostosFederais) return null;

  return (
    <>
      <Separator className="my-2" />
      <h5 className="text-sm font-semibold">Impostos federais</h5>

      <Grid>
        <PaymentAccountFields
          subject="dos impostos federais"
          contaPagamento={impostosFederais.contaPagamento}
          dadosContaCliente={impostosFederais.dadosContaCliente}
        />

        <HighlightField
          label="Observações dos impostos federais"
          value={text(impostosFederais.observacao)}
        />
      </Grid>

      <div className="grid gap-3 md:grid-cols-2">
        <FederalTaxItem title="II" tax={impostosFederais.ii} />
        <FederalTaxItem title="IPI" tax={impostosFederais.ipi} />
        <FederalTaxItem title="PIS" tax={impostosFederais.pis} />
        <FederalTaxItem title="COFINS" tax={impostosFederais.cofins} />
      </div>
    </>
  );
}

function AfrmmView({
  afrmm,
}: {
  afrmm?: {
    contaPagamento?: string | null;
    dadosContaCliente?: {
      banco?: string | null;
      agencia?: string | null;
      conta?: string | null;
    } | null;
    regime?: string | null;
    detalheBeneficio?: string | null;
    observacao?: string | null;
  } | null;
}) {
  if (!afrmm) return null;

  return (
    <>
      <Separator className="my-2" />
      <h5 className="text-sm font-semibold">AFRMM</h5>

      <Grid>
        <PaymentAccountFields
          subject="do AFRMM"
          contaPagamento={afrmm.contaPagamento}
          dadosContaCliente={afrmm.dadosContaCliente}
        />

        <TaxRegimeStatus
          regime={afrmm.regime}
          description={text(afrmm.detalheBeneficio)}
        />

        <HighlightField
          label="Observações AFRMM"
          value={text(afrmm.observacao)}
        />
      </Grid>
    </>
  );
}

function ServiceBlock({
  title,
  enabled,
  mode,
  children,
}: {
  title: string;
  enabled?: boolean | null;
  mode?: "SIM" | "NAO" | "CASO_A_CASO" | undefined;
  children: React.ReactNode;
}) {
  if (!enabled) return null;

  return (
    <>
      <TitleField label={title} value={<HiredBadge value={mode} />} />
      {children}
    </>
  );
}

type ImportServices = NonNullable<EscopoForm["servicos"]["importacao"]>;
type ExportServices = NonNullable<EscopoForm["servicos"]["exportacao"]>;

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function AdvisoryServiceView({
  title,
  service,
}: {
  title: string;
  service?: ImportServices["assessoria"] | ExportServices["assessoria"];
}) {
  if (!service?.habilitado) {
    return <EmptyState>Serviço de assessoria não contratado.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock title={title} enabled={service.habilitado} mode="SIM">
        <Field label="Tipo de valor" value={text(service.tipoValor)} />
        <Field label="Valor" value={currency(service.valor)} />
        <Field
          label="Última atualização"
          value={date(service.ultimaAtualizacao)}
        />
        <HighlightField
          label="Observação da assessoria"
          value={text(service.observacao)}
        />
      </ServiceBlock>
    </Grid>
  );
}

function InsuranceServiceView({
  title,
  service,
}: {
  title: string;
  service?:
    | ImportServices["seguroInternacional"]
    | ExportServices["seguroInternacional"];
}) {
  if (!service?.habilitado) {
    return <EmptyState>Seguro internacional não contratado.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock
        title={title}
        enabled={service.habilitado}
        mode={service.modalidade ?? undefined}
      >
        <Field label="Modalidade" value={text(service.modalidade)} />
        <Field label="Valor mínimo" value={currency(service.valorMinimo)} />
        <Field
          label="% sobre frete + mercadoria (CFR/CPT)"
          value={text(service.percentualSobreCfr)}
        />
        <Field
          label="Data de inclusão da apólice"
          value={date(service.dataInclusaoApolice)}
        />
        <HighlightField
          label="Descrição complementar"
          value={text(service.descricaoComplementar)}
        />
      </ServiceBlock>
    </Grid>
  );
}

function InternationalFreightServiceView({
  title,
  service,
}: {
  title: string;
  service?:
    ImportServices["freteInternacional"] | ExportServices["freteInternacional"];
}) {
  if (!service?.habilitado) {
    return <EmptyState>Frete internacional não contratado.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock
        title={title}
        enabled={service.habilitado}
        mode={service.modalidade ?? undefined}
      >
        <Field label="Modalidade" value={text(service.modalidade)} />
        <Field
          label="Responsável pela contratação"
          value={freightResponsibleLabel(service.responsavelFrete)}
        />
        <Field label="% PTAX negociada" value={text(service.ptaxNegociado)} />
        <HighlightField
          label="Observação do frete internacional"
          value={text(service.observacao)}
        />
        {service.responsavelFrete === "TERCEIRO" ? (
          <ThirdPartyFreightProvidersView
            providers={service.prestadoresTerceiros}
          />
        ) : null}
      </ServiceBlock>
    </Grid>
  );
}

function RoadFreightServiceView({
  title,
  service,
}: {
  title: string;
  service?:
    ImportServices["freteRodoviario"] | ExportServices["freteRodoviario"];
}) {
  if (!service?.habilitado) {
    return <EmptyState>Frete rodoviário não contratado.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock
        title={title}
        enabled={service.habilitado}
        mode={service.modalidade ?? undefined}
      >
        <Field label="Modalidade" value={text(service.modalidade)} />
        <HighlightField
          label="Observação geral"
          value={text(service.observacaoGeral)}
        />
      </ServiceBlock>
    </Grid>
  );
}

function ImportCustomsServicesView({
  services,
  scope,
}: {
  services?: ImportServices;
  scope: EscopoForm;
}) {
  if (!services) {
    return <EmptyState>Sem configuração de serviços de importação.</EmptyState>;
  }

  const hasCustomsService =
    services.despachoAduaneiroImportacao?.habilitado ||
    services.preposto?.habilitado ||
    services.emissaoLiLpco?.habilitado ||
    services.cadastroCatalogoProdutos?.habilitado ||
    services.emissaoNfe?.habilitado ||
    Boolean(services.regimeEspecial?.length);

  if (!hasCustomsService) {
    return <EmptyState>Sem serviços aduaneiros contratados.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock
        title="Despacho aduaneiro de importação"
        enabled={services.despachoAduaneiroImportacao?.habilitado}
        mode="SIM"
      >
        <Field
          label="Tipo de valor"
          value={text(services.despachoAduaneiroImportacao?.tipoValor)}
        />
        <Field
          label="Valor"
          value={currency(services.despachoAduaneiroImportacao?.valor)}
        />
        <Field
          label="Última atualização"
          value={date(services.despachoAduaneiroImportacao?.ultimaAtualizacao)}
        />
        <HighlightField
          label="Observação do despacho"
          value={text(services.despachoAduaneiroImportacao?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Preposto"
        enabled={services.preposto?.habilitado}
        mode={services.preposto?.modalidade ?? undefined}
      >
        <Field
          label="Valor"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
        <Field
          label="Incluso no desembaraço CASCO"
          value={text(services.preposto?.inclusoNoDesembaracoCasco)}
        />
        <Field
          label="Preposto selecionado"
          value={text(services.preposto?.prepostoSelecionado?.nome)}
        />
        <Field
          label="Contato"
          value={text(services.preposto?.prepostoSelecionado?.contatoNome)}
        />
        <Field
          label="Telefone"
          value={text(services.preposto?.prepostoSelecionado?.telefone)}
        />
        <Field
          label="Consultar prepostos"
          value={
            <Link
              href={
                "/scope/prepostos?cidade=" +
                queryList(importPrepostoCities(scope.operacao.importacao)) +
                "&operacao=" +
                queryList(scope.operacao.tipos)
              }
            >
              <span className="underline">Abrir relação de prepostos</span>
            </Link>
          }
        />
        <HighlightField
          label="Observação do preposto"
          value={text(services.preposto?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Emissão LI/LPCO"
        enabled={services.emissaoLiLpco?.habilitado}
        mode={services.emissaoLiLpco?.modalidade ?? undefined}
      >
        <Field
          label="Modalidade"
          value={text(services.emissaoLiLpco?.modalidade)}
        />
        <Field label="Valor" value={currency(services.emissaoLiLpco?.valor)} />
        <HighlightField
          label="Observação"
          value={text(services.emissaoLiLpco?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Cadastro de catálogo de produtos"
        enabled={services.cadastroCatalogoProdutos?.habilitado}
        mode={services.cadastroCatalogoProdutos?.modalidade ?? undefined}
      >
        <Field
          label="Modalidade"
          value={text(services.cadastroCatalogoProdutos?.modalidade)}
        />
        <Field
          label="Valor"
          value={currency(services.cadastroCatalogoProdutos?.valor)}
        />
        <HighlightField
          label="Observação"
          value={text(services.cadastroCatalogoProdutos?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Emissão de NF-e"
        enabled={services.emissaoNfe?.habilitado}
        mode={services.emissaoNfe?.modalidade ?? undefined}
      >
        <Field
          label="Modalidade"
          value={text(services.emissaoNfe?.modalidade)}
        />
        <Field label="Valor" value={currency(services.emissaoNfe?.valor)} />
        <HighlightField
          label="Observação"
          value={text(services.emissaoNfe?.observacao)}
        />
      </ServiceBlock>

      {services.regimeEspecial?.length ? (
        <div className="grid gap-3 md:col-span-2">
          <TitleField label="Regimes especiais" value="Cadastrados" />
          {services.regimeEspecial.map((regime, index) => (
            <Field
              key={index}
              label={regime.nomeRegime}
              value={currency(regime.valor)}
            />
          ))}
        </div>
      ) : null}
    </Grid>
  );
}

function ExportCustomsServicesView({
  services,
}: {
  services?: ExportServices;
}) {
  if (!services) {
    return <EmptyState>Sem configuração de serviços de exportação.</EmptyState>;
  }

  const hasCustomsService =
    services.despachoAduaneiroExportacao?.habilitado ||
    services.preposto?.habilitado ||
    services.certificadoOrigem?.habilitado ||
    services.certificadoFitossanitario?.habilitado ||
    services.outrosCertificados?.habilitado ||
    Boolean(services.regimeEspecial?.length);

  if (!hasCustomsService) {
    return <EmptyState>Sem serviços aduaneiros contratados.</EmptyState>;
  }

  return (
    <Grid>
      <ServiceBlock
        title="Despacho aduaneiro de exportação"
        enabled={services.despachoAduaneiroExportacao?.habilitado}
        mode="SIM"
      >
        <Field
          label="Tipo de valor"
          value={text(services.despachoAduaneiroExportacao?.tipoValor)}
        />
        <Field
          label="Valor"
          value={currency(services.despachoAduaneiroExportacao?.valor)}
        />
        <Field
          label="Última atualização"
          value={date(services.despachoAduaneiroExportacao?.ultimaAtualizacao)}
        />
        <HighlightField
          label="Observação do despacho"
          value={text(services.despachoAduaneiroExportacao?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Preposto"
        enabled={services.preposto?.habilitado}
        mode={services.preposto?.modalidade ?? undefined}
      >
        <Field
          label="Valor"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
        <Field
          label="Incluso no desembaraço CASCO"
          value={text(services.preposto?.inclusoNoDesembaracoCasco)}
        />
        <Field
          label="Cidades, portos e fronteiras"
          value={list(services.preposto?.cidadesLiberacao)}
        />
        <Field
          label="Outro porto"
          value={text(services.preposto?.outroPorto)}
        />
        <Field
          label="Outra fronteira"
          value={text(services.preposto?.outraFronteira)}
        />
        <Field
          label="Preposto selecionado"
          value={text(services.preposto?.prepostoSelecionado?.nome)}
        />
        <Field
          label="Contato"
          value={text(services.preposto?.prepostoSelecionado?.contatoNome)}
        />
        <Field
          label="Telefone"
          value={text(services.preposto?.prepostoSelecionado?.telefone)}
        />
        <HighlightField
          label="Observação do preposto"
          value={text(services.preposto?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Certificado de origem"
        enabled={services.certificadoOrigem?.habilitado}
        mode={services.certificadoOrigem?.modalidade ?? undefined}
      >
        <Field
          label="Modalidade"
          value={text(services.certificadoOrigem?.modalidade)}
        />
        <Field
          label="Valor"
          value={currency(services.certificadoOrigem?.valor)}
        />
        <HighlightField
          label="Observação"
          value={text(services.certificadoOrigem?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Certificado fitossanitário"
        enabled={services.certificadoFitossanitario?.habilitado}
        mode={services.certificadoFitossanitario?.modalidade ?? undefined}
      >
        <Field
          label="Modalidade"
          value={text(services.certificadoFitossanitario?.modalidade)}
        />
        <Field
          label="Valor"
          value={currency(services.certificadoFitossanitario?.valor)}
        />
        <HighlightField
          label="Observação"
          value={text(services.certificadoFitossanitario?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Outros certificados"
        enabled={services.outrosCertificados?.habilitado}
        mode="SIM"
      >
        {(services.outrosCertificados?.itens ?? []).map((item, index) => (
          <Field key={index} label={item.chave} value={currency(item.valor)} />
        ))}
      </ServiceBlock>

      {services.regimeEspecial?.length ? (
        <div className="grid gap-3 md:col-span-2">
          <TitleField label="Regimes especiais" value="Cadastrados" />
          {services.regimeEspecial.map((regime, index) => (
            <Field
              key={index}
              label={regime.nomeRegime}
              value={currency(regime.valor)}
            />
          ))}
        </div>
      ) : null}
    </Grid>
  );
}

function ScopeDetails({
  scope,
  versionLabel,
}: {
  scope: EscopoForm;
  versionLabel: string;
}) {
  const importacao = scope.operacao.importacao;
  const exportacao = scope.operacao.exportacao;
  const importServices = scope.servicos.importacao;
  const exportServices = scope.servicos.exportacao;
  const showImport = scope.operacao.tipos.includes("IMPORTACAO");
  const showExport = scope.operacao.tipos.includes("EXPORTACAO");

  const { data: metadataResponse } = useScopeMetadata();
  const { data: salarioMinimoData } = useOrganizationSettingsByKey(
    "salario_minimo_vigente",
  );
  const { data: ctaBancariaData } = useOrganizationSettingsByKey(
    "dados_bancarios_casco",
  );

  const responsaveis = metadataResponse?.responsaveis ?? [];
  const salarioMinimo = salarioMinimoData?.valor;
  const ctaBancariaCasco = ctaBancariaData ?? {};
  const paymentPreference = scope.financeiro.preferencia as string | undefined;

  const responsibleNames = (ids?: string[] | null) =>
    list(
      (ids ?? []).map(
        (id) =>
          responsaveis.find((responsavel) => responsavel.id === id)?.nome ?? id,
      ),
    );

  const operationCards = (
    importContent: React.ReactNode,
    exportContent: React.ReactNode,
  ) => (
    <div className="grid gap-4 xl:grid-cols-2">
      {showImport ? (
        <ViewCard title="Importação">{importContent}</ViewCard>
      ) : null}
      {showExport ? (
        <ViewCard title="Exportação">{exportContent}</ViewCard>
      ) : null}
      {!showImport && !showExport ? (
        <EmptyState>Nenhuma operação cadastrada.</EmptyState>
      ) : null}
    </div>
  );

  const tabs = [
    {
      id: "dados-cliente",
      label: "Dados do cliente",
      content: (
        <ViewCard title="Contatos">
          <div className="grid gap-4">
            {scope.contatos?.length ? (
              scope.contatos.map((contato, index) => (
                <Card key={index} className="gap-3 bg-muted/20 p-4">
                  <h5 className="text-sm font-semibold">
                    {"Contato " + (index + 1)}
                  </h5>
                  <Grid>
                    <Field label="Nome" value={text(contato.nome)} />
                    <Field label="E-mail" value={text(contato.email)} />
                    <Field
                      label="Cargo / departamento"
                      value={text(contato.cargoDepartamento)}
                    />
                    <Field label="Telefone" value={text(contato.telefone)} />
                  </Grid>
                </Card>
              ))
            ) : (
              <EmptyState>Nenhum contato cadastrado.</EmptyState>
            )}
          </div>
        </ViewCard>
      ),
    },
    {
      id: "sobre-empresa",
      label: "Sobre a empresa",
      content: (
        <div className="grid gap-4">
          <ViewCard title="Dados cadastrais">
            <Grid>
              <Field
                label="Razão social"
                value={text(scope.sobreEmpresa.razaoSocial)}
              />
              <Field
                label="Nome resumido"
                value={text(scope.sobreEmpresa.nomeResumido)}
              />
              <Field label="CNPJ" value={formatCNPJ(scope.sobreEmpresa.cnpj)} />
              <Field
                label="Inscrição estadual"
                value={text(scope.sobreEmpresa.inscricaoEstadual)}
              />
              <Field
                label="Inscrição municipal"
                value={text(scope.sobreEmpresa.inscricaoMunicipal)}
              />
              <Field
                label="Endereço do escritório"
                value={text(scope.sobreEmpresa.enderecoCompletoEscritorio)}
              />
              <Field
                label="Endereço do armazém"
                value={text(scope.sobreEmpresa.enderecoCompletoArmazem)}
              />
              <Field
                label="CNAE principal"
                value={text(scope.sobreEmpresa.cnaePrincipal)}
              />
              <Field
                label="CNAEs secundários"
                value={text(scope.sobreEmpresa.cnaeSecundario)}
              />
              <Field
                label="Regime de tributação"
                value={text(scope.sobreEmpresa.regimeTributacao)}
              />
              <Field
                label="Modalidade RADAR"
                value={text(scope.sobreEmpresa.modalidadeRadar)}
              />
              <Field
                label="Tipos de operação"
                value={list(scope.operacao.tipos)}
              />
            </Grid>
            <HighlightField
              label="Particularidades gerais"
              value={text(scope.geral?.descricao)}
            />
          </ViewCard>

          {showImport && importacao ? (
            <ViewCard title="Perfil da importação">
              <Grid>
                <Field
                  label="Produtos importados"
                  value={text(importacao.produtosImportados)}
                />
                <Field
                  label="Vínculo com exportador"
                  value={text(importacao.vinculoComExportador)}
                />
                <Field
                  label="Modais de entrada"
                  value={modalLocalList(importacao.modaisEntrada)}
                />
                <Field
                  label="Locais de entrada"
                  value={list(importacao.locaisEntrada)}
                />
                <Field
                  label="Outro local de entrada"
                  value={text(importacao.outroLocalEntrada)}
                />
                <Field
                  label="Locais de desembaraço"
                  value={list(importacao.locaisDesembaraco)}
                />
                <Field
                  label="Outro local de desembaraço"
                  value={text(importacao.outroLocalDesembaraco)}
                />
                <Field label="Destinação" value={list(importacao.destinacao)} />
                <Field
                  label="Subtipo de consumo"
                  value={list(importacao.subtipoConsumo)}
                />
              </Grid>

              <div className="grid gap-3">
                {(importacao.ncms ?? [])
                  .filter((ncm) => ncm.codigo)
                  .map((ncm, index) => (
                    <Card key={index} className="gap-3 bg-muted/20 p-3">
                      <Grid>
                        <Field
                          label={
                            index === 0 ? "NCM principal" : "NCM " + (index + 1)
                          }
                          value={text(ncm.codigo)}
                        />
                        <Field
                          label="Possui benefício"
                          value={text(ncm.possuiBeneficio)}
                        />
                        <HighlightField
                          label="Descrição do benefício"
                          value={text(ncm.descricaoBeneficio)}
                        />
                      </Grid>
                    </Card>
                  ))}
              </div>

              <HighlightField
                label="Observação sobre NCM"
                value={text(importacao.observacaoNcms)}
              />
            </ViewCard>
          ) : null}

          {showExport && exportacao ? (
            <ViewCard title="Perfil da exportação">
              <Grid>
                <Field
                  label="Produtos exportados"
                  value={text(exportacao.produtosExportados)}
                />
                <Field label="Destinação" value={list(exportacao.destinacao)} />
                <Field
                  label="Subtipo de consumo"
                  value={list(exportacao.subtipoConsumo)}
                />
              </Grid>

              <div className="grid gap-3">
                {(exportacao.ncms ?? [])
                  .filter((ncm) => ncm.codigo)
                  .map((ncm, index) => (
                    <Card key={index} className="gap-3 bg-muted/20 p-3">
                      <Grid>
                        <Field
                          label={
                            index === 0 ? "NCM principal" : "NCM " + (index + 1)
                          }
                          value={text(ncm.codigo)}
                        />
                        <Field
                          label="Possui benefício"
                          value={text(ncm.possuiBeneficio)}
                        />
                        <HighlightField
                          label="Descrição do benefício"
                          value={text(ncm.descricaoBeneficio)}
                        />
                      </Grid>
                    </Card>
                  ))}
              </div>

              <HighlightField
                label="Observação sobre NCM"
                value={text(exportacao.observacaoNcms)}
              />
            </ViewCard>
          ) : null}
        </div>
      ),
    },
    {
      id: "tributos",
      label: "Tributos",
      content:
        showImport && importacao ? (
          <ViewCard title="Tributos da importação">
            <FederalTaxesView impostosFederais={importacao.impostosFederais} />
            <AfrmmView afrmm={importacao.afrmm} />

            <Separator className="my-2" />
            <h5 className="text-sm font-semibold">ICMS</h5>
            <Grid>
              <PaymentAccountFields
                subject="do ICMS"
                contaPagamento={importacao.icms?.contaPagamento}
                dadosContaCliente={importacao.icms?.dadosContaCliente}
              />
              <TaxRegimeStatus
                label="Regime geral"
                regime={importacao.icms?.regime}
                description={text(importacao.icms?.observacao)}
              />
              {importacao.icms?.regime !== "BENEFICIO" ? (
                <HighlightField
                  label="Observações ICMS"
                  value={text(importacao.icms?.observacao)}
                />
              ) : null}
            </Grid>

            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(importacao.icms?.porDestinacao ?? {})
                .filter(
                  ([destinacao, detalhe]) =>
                    detalhe && importacao.destinacao.includes(destinacao),
                )
                .map(([destinacao, detalhe]) => (
                  <Card key={destinacao} className="gap-3 p-3">
                    <h6 className="text-sm font-semibold">
                      {ICMS_DESTINACAO_LABEL[destinacao] ?? destinacao}
                    </h6>
                    <div className="grid gap-3">
                      <TaxRegimeStatus
                        regime={detalhe?.regime}
                        showDescription={false}
                      />
                      <Grid>
                        <Field
                          label="Alíquota base"
                          value={text(detalhe?.recolhida)}
                        />
                        <Field
                          label="Alíquota efetiva"
                          value={text(detalhe?.efetiva)}
                        />
                      </Grid>
                    </div>
                  </Card>
                ))}
            </div>
          </ViewCard>
        ) : (
          <ViewCard title="Tributos da importação">
            <EmptyState>
              Este escopo não possui operação de importação cadastrada.
            </EmptyState>
          </ViewCard>
        ),
    },
    {
      id: "comercial-casco",
      label: "Comercial CASCO",
      content: (
        <ViewCard title="Comercial CASCO responsável">
          <Grid>
            <Field
              label="Responsável comercial"
              value={
                <ResponsibleShow
                  value={scope.sobreEmpresa.responsavelComercial}
                  options={responsaveis}
                />
              }
            />
          </Grid>
        </ViewCard>
      ),
    },
    {
      id: "assessoria-especial",
      label: "Assessoria especial",
      content: operationCards(
        <div className="grid gap-4">
          <Grid>
            <Field
              label="Analista AE — Importação"
              value={responsibleNames(importacao?.analistaAE)}
            />
          </Grid>
          <AdvisoryServiceView
            title="Assessoria de importação"
            service={importServices?.assessoria}
          />
        </div>,
        <div className="grid gap-4">
          <Grid>
            <Field
              label="Analista AE — Exportação"
              value={responsibleNames(exportacao?.analistaAE)}
            />
          </Grid>
          <AdvisoryServiceView
            title="Assessoria de exportação"
            service={exportServices?.assessoria}
          />
        </div>,
      ),
    },
    {
      id: "seguro-internacional",
      label: "Seguro internacional",
      content: operationCards(
        <InsuranceServiceView
          title="Seguro de importação"
          service={importServices?.seguroInternacional}
        />,
        <InsuranceServiceView
          title="Seguro de exportação"
          service={exportServices?.seguroInternacional}
        />,
      ),
    },
    {
      id: "frete-internacional",
      label: "Frete internacional",
      content: operationCards(
        <InternationalFreightServiceView
          title="Frete internacional de importação"
          service={importServices?.freteInternacional}
        />,
        <InternationalFreightServiceView
          title="Frete internacional de exportação"
          service={exportServices?.freteInternacional}
        />,
      ),
    },
    {
      id: "despacho-aduaneiro",
      label: "Despacho aduaneiro",
      content: (
        <div className="grid gap-4">
          <ViewCard title="Analistas de despacho aduaneiro">
            <Grid>
              {showImport && importacao ? (
                <Field
                  label="Analista DA — Importação"
                  value={responsibleNames(importacao.analistaDA)}
                />
              ) : null}
              {showExport && exportacao ? (
                <Field
                  label="Analista DA — Exportação"
                  value={responsibleNames(exportacao.analistaDA)}
                />
              ) : null}
            </Grid>
          </ViewCard>

          {showImport && importacao ? (
            <ViewCard title="Exigências da importação">
              <Grid>
                <Field
                  label="Necessidade de DTA"
                  value={text(importacao.necessidadeDta)}
                />
                <Field
                  label="Necessidade de DTC"
                  value={text(importacao.necessidadeDtc)}
                />
                <Field
                  label="Necessidade de LI/LPCO"
                  value={text(importacao.necessidadeLiLpco)}
                />
                <Field label="Anuências" value={list(importacao.anuencias)} />
                <Field
                  label="Outro órgão anuente"
                  value={text(importacao.outroOrgaoAnuente)}
                />
              </Grid>
            </ViewCard>
          ) : null}

          {operationCards(
            <ImportCustomsServicesView
              services={importServices}
              scope={scope}
            />,
            <ExportCustomsServicesView services={exportServices} />,
          )}
        </div>
      ),
    },
    {
      id: "frete-rodoviario",
      label: "Frete rodoviário",
      content: operationCards(
        <RoadFreightServiceView
          title="Frete rodoviário de importação"
          service={importServices?.freteRodoviario}
        />,
        <RoadFreightServiceView
          title="Frete rodoviário de exportação"
          service={exportServices?.freteRodoviario}
        />,
      ),
    },
    {
      id: "financeiro",
      label: "Financeiro",
      content: (
        <div className="grid gap-4">
          <ViewCard title="Informações financeiras da CASCO">
            <Grid>
              <Field
                label="Salário mínimo vigente"
                value={currency(salarioMinimo ?? 0)}
              />
              <Field
                label="Dados bancários CASCO"
                value={account(ctaBancariaCasco)}
              />
            </Grid>
          </ViewCard>

          <ViewCard title="Devolução de saldo ao cliente">
            <Grid>
              <Field
                label="Preferência de pagamento"
                value={text(paymentPreference ?? "TRANSFERENCIA")}
              />
              {paymentPreference === "TRANSFERECIA" ||
              paymentPreference === "TRANSFERENCIA" ||
              !paymentPreference ? (
                <Field
                  label="Dados bancários para devolução"
                  value={list(
                    (scope.financeiro.dadosBancariosClienteDevolucaoSaldo ?? [])
                      .map((conta) => account(conta))
                      .filter(Boolean) as string[],
                  )}
                />
              ) : null}
              {paymentPreference === "PIX" ? (
                <Field
                  label="Chave PIX para devolução"
                  value={text(scope.financeiro.chavePIXClienteDevolucaoSaldo)}
                />
              ) : null}
              <HighlightField
                label="Observações financeiras"
                value={text(scope.financeiro.observacoesFinanceiro)}
              />
            </Grid>
          </ViewCard>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-4 md:p-6 print-avoid-break">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Resumo do escopo
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione uma categoria para consultar os dados cadastrados.
          </p>
        </div>
        <Badge>{versionLabel}</Badge>
      </div>

      <ScopeViewTabs tabs={tabs} />
    </Card>
  );
}

export default function ViewScope({ id }: { id: string }) {
  const router = useRouter();

  const {
    data: scopeResponse,
    isLoading: loadingScope,
    error: scopeError,
  } = useScope(id);

  const selectedScope = useMemo(
    () => scopeResponse?.draft ?? null,
    [scopeResponse?.draft],
  );

  const createdBy = scopeResponse?.created_by;

  if (loadingScope) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RotateCw className="h-4 w-4 animate-spin" />
          Carregando visualização...
        </div>
      </Card>
    );
  }

  if (scopeError || !selectedScope) {
    return (
      <Card className="p-4">
        <p className="font-medium">Escopo não encontrado.</p>
        <Button className="mt-3" onClick={() => router.back()}>
          Voltar para escopos
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4" id="scope-view-layout">
      <Card className="p-4 print-avoid-break">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Visualização do Escopo
            </h1>
            <p className="text-sm text-muted-foreground">
              Documento em modo leitura para acompanhamento operacional.
            </p>

            {createdBy && (
              <p className="mt-5 text-sm text-muted-foreground">
                Criado por {createdBy.nome}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button asChild variant="outline">
              <Link href={`/scope/${id}?step=SOBRE_EMPRESA`}>Editar</Link>
            </Button>
          </div>
        </div>
      </Card>

      <ScopeDetails scope={selectedScope} versionLabel="Escopo atual" />

      <style jsx global>{`
        @media print {
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }

          body {
            background: white !important;
          }

          #scope-view-layout {
            gap: 12px;
          }

          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
