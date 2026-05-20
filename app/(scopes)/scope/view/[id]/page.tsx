"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  CheckCircle2,
  CornerUpLeft,
  Ellipsis,
  Pencil,
  RotateCw,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { EscopoForm } from "@/domain/scope/types";
import { useScope, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ } from "@/utils/format";
import { ResponsibleShow } from "@/components/ResponsibleShow";
import { useOrganizationSettingsByKey } from "@/lib/api/hooks/use-dashboards";

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

const account = (
  v?: {
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  } | null,
) =>
  !v || (!v.banco && !v.agencia && !v.conta)
    ? null
    : `Banco: ${text(v.banco)} • Agência: ${text(v.agencia)} • Conta: ${text(v.conta)}`;

const ICMS_DESTINACAO_LABEL: Record<string, string> = {
  REVENDA: "Revenda",
  INDUSTRIALIZACAO: "Industrialização",
  USO_E_CONSUMO: "Uso e consumo",
  ATIVO_IMOBILIZADO: "Ativo imobilizado",
};

function ScopeViewActions({ cnpj, id }: { cnpj: string; id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Abrir opções do escopo"
            onClick={() => setOpen((current) => !current)}
          >
            <Ellipsis className="h-5 w-5" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-56 p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="grid gap-1">
            <Link
              href={`/scope/list`}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
              <span>Voltar para escopos</span>
            </Link>

            <Separator />

            <Link
              href={`/clients/${cnpj}/scopes/edit/${id}`}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span>Editar</span>
            </Link>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}

const hiredBadge = (
  <Badge className="bg-emerald-500 text-white">
    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
    Contrata
  </Badge>
);

const hasEnabledService = (services?: Record<string, any> | null) =>
  Object.values(services ?? {}).some(
    (service) => service && typeof service === "object" && service.habilitado,
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

function ServiceBlock({
  title,
  enabled,
  children,
}: {
  title: string;
  enabled?: boolean | null;
  children: React.ReactNode;
}) {
  if (!enabled) return null;

  return (
    <>
      <TitleField label={title} value={hiredBadge} />
      {children}
    </>
  );
}

function ImportServicesView({
  services,
}: {
  services: NonNullable<EscopoForm["servicos"]["importacao"]>;
}) {
  return (
    <Grid>
      <ServiceBlock
        title="Despacho aduaneiro importação"
        enabled={services.despachoAduaneiroImportacao?.habilitado}
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
        <Field
          label="Observação despacho aduaneiro"
          value={text(services.despachoAduaneiroImportacao?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock title="Preposto" enabled={services.preposto?.habilitado}>
        <Field
          label="Valor do preposto"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
        <Field
          label="Incluso no desembaraço CASCO"
          value={text(services.preposto?.inclusoNoDesembaracoCasco)}
        />
        <Field
          label="Cidades/portos/fronteiras"
          value={list(services.preposto?.cidadesLiberacao)}
        />
        <Field label="Outro porto" value={text(services.preposto?.outroPorto)} />
        <Field
          label="Outra fronteira"
          value={text(services.preposto?.outraFronteira)}
        />
        <Field
          label="Preposto selecionado"
          value={text(services.preposto?.prepostoSelecionado?.nome)}
        />
        <Field
          label="Contato do preposto"
          value={text(services.preposto?.prepostoSelecionado?.contatoNome)}
        />
        <Field
          label="Telefone do preposto"
          value={text(services.preposto?.prepostoSelecionado?.telefone)}
        />
        <Field
          label="Valor do preposto selecionado"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Emissão LI/LPCO"
        enabled={services.emissaoLiLpco?.habilitado}
      >
        <Field
          label="Valor emissão LI/LPCO"
          value={currency(services.emissaoLiLpco?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Cadastro de catálogo de produtos"
        enabled={services.cadastroCatalogoProdutos?.habilitado}
      >
        <Field
          label="Valor cadastro de catálogo"
          value={currency(services.cadastroCatalogoProdutos?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock title="Assessoria" enabled={services.assessoria?.habilitado}>
        <Field
          label="Tipo de valor assessoria"
          value={text(services.assessoria?.tipoValor)}
        />
        <Field
          label="Valor assessoria"
          value={currency(services.assessoria?.valor)}
        />
        <Field
          label="Última atualização assessoria"
          value={date(services.assessoria?.ultimaAtualizacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Frete internacional"
        enabled={services.freteInternacional?.habilitado}
      >
        <Field
          label="Modalidade frete internacional"
          value={text(services.freteInternacional?.modalidade)}
        />
        <Field
          label="% PTAX negociada"
          value={text(services.freteInternacional?.ptaxNegociado)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Seguro internacional"
        enabled={services.seguroInternacional?.habilitado}
      >
        <Field
          label="Percentual sobre CFR"
          value={text(services.seguroInternacional?.percentualSobreCfr)}
        />
        <Field
          label="Data inclusão da apólice"
          value={date(services.seguroInternacional?.dataInclusaoApolice)}
        />
        <Field
          label="Descrição complementar"
          value={text(services.seguroInternacional?.descricaoComplementar)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Frete rodoviário"
        enabled={services.freteRodoviario?.habilitado}
      >
        <Field
          label="Modalidade frete rodoviário"
          value={text(services.freteRodoviario?.modalidade)}
        />
        <Field
          label="Observação geral"
          value={text(services.freteRodoviario?.observacaoGeral)}
        />
        <Field
          label="Regime especial"
          value={list(services.regimeEspecial?.map((r) => r.nomeRegime))}
        />
      </ServiceBlock>

      <ServiceBlock title="Emissão NFe" enabled={services.emissaoNfe?.habilitado}>
        <Field
          label="Valor emissão NFe"
          value={currency(services.emissaoNfe?.valor)}
        />
      </ServiceBlock>
    </Grid>
  );
}

function ExportServicesView({
  services,
}: {
  services: NonNullable<EscopoForm["servicos"]["exportacao"]>;
}) {
  return (
    <Grid>
      <ServiceBlock
        title="Despacho aduaneiro exportação"
        enabled={services.despachoAduaneiroExportacao?.habilitado}
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
          label="Observação despacho aduaneiro"
          value={text(services.despachoAduaneiroExportacao?.observacao)}
        />
      </ServiceBlock>

      <ServiceBlock title="Preposto" enabled={services.preposto?.habilitado}>
        <Field
          label="Valor do preposto"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
        <Field
          label="Incluso no desembaraço CASCO"
          value={text(services.preposto?.inclusoNoDesembaracoCasco)}
        />
        <Field
          label="Cidades/portos/fronteiras"
          value={list(services.preposto?.cidadesLiberacao)}
        />
        <Field label="Outro porto" value={text(services.preposto?.outroPorto)} />
        <Field
          label="Outra fronteira"
          value={text(services.preposto?.outraFronteira)}
        />
        <Field
          label="Preposto selecionado"
          value={text(services.preposto?.prepostoSelecionado?.nome)}
        />
        <Field
          label="Contato do preposto"
          value={text(services.preposto?.prepostoSelecionado?.contatoNome)}
        />
        <Field
          label="Telefone do preposto"
          value={text(services.preposto?.prepostoSelecionado?.telefone)}
        />
        <Field
          label="Valor do preposto selecionado"
          value={currency(services.preposto?.prepostoSelecionado?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Certificado de origem"
        enabled={services.certificadoOrigem?.habilitado}
      >
        <Field
          label="Valor certificado de origem"
          value={currency(services.certificadoOrigem?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Certificado fitossanitário"
        enabled={services.certificadoFitossanitario?.habilitado}
      >
        <Field
          label="Valor certificado fitossanitário"
          value={currency(services.certificadoFitossanitario?.valor)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Outros certificados"
        enabled={services.outrosCertificados?.habilitado}
      >
        <Field
          label="Itens de outros certificados"
          value={list(services.outrosCertificados?.itens?.map((i) => i.chave))}
        />
      </ServiceBlock>

      <ServiceBlock title="Assessoria" enabled={services.assessoria?.habilitado}>
        <Field
          label="Tipo de valor assessoria"
          value={text(services.assessoria?.tipoValor)}
        />
        <Field
          label="Valor assessoria"
          value={currency(services.assessoria?.valor)}
        />
        <Field
          label="Última atualização assessoria"
          value={date(services.assessoria?.ultimaAtualizacao)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Frete internacional"
        enabled={services.freteInternacional?.habilitado}
      >
        <Field
          label="% PTAX negociada"
          value={text(services.freteInternacional?.ptaxNegociado)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Seguro internacional"
        enabled={services.seguroInternacional?.habilitado}
      >
        <Field
          label="Valor mínimo"
          value={currency(services.seguroInternacional?.valorMinimo)}
        />
        <Field
          label="Percentual sobre CFR"
          value={text(services.seguroInternacional?.percentualSobreCfr)}
        />
        <Field
          label="Data inclusão da apólice"
          value={date(services.seguroInternacional?.dataInclusaoApolice)}
        />
        <Field
          label="Descrição complementar"
          value={text(services.seguroInternacional?.descricaoComplementar)}
        />
      </ServiceBlock>

      <ServiceBlock
        title="Frete rodoviário"
        enabled={services.freteRodoviario?.habilitado}
      >
        <Field
          label="Modalidade frete rodoviário"
          value={text(services.freteRodoviario?.modalidade)}
        />
        <Field
          label="Observação geral"
          value={text(services.freteRodoviario?.observacaoGeral)}
        />
        <Field
          label="Regime especial"
          value={list(services.regimeEspecial?.map((r) => r.nomeRegime))}
        />
      </ServiceBlock>
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
  const i = scope.operacao.importacao;
  const e = scope.operacao.exportacao;
  const si = scope.servicos.importacao;
  const se = scope.servicos.exportacao;

  const showSI = scope.operacao.tipos.includes("IMPORTACAO");
  const showSE = scope.operacao.tipos.includes("EXPORTACAO");

  const hasImportServices = showSI && hasEnabledService(si);
  const hasExportServices = showSE && hasEnabledService(se);

  const { data: metadataResponse } = useScopeMetadata();

  const { data: salarioMinimoData } = useOrganizationSettingsByKey(
    "salario_minimo_vigente",
  );
  const { data: ctaBancariaData } = useOrganizationSettingsByKey(
    "dados_bancarios_casco",
  );

  const salarioMinimo = salarioMinimoData?.valor;
  const ctaBancariaCasco = ctaBancariaData ?? {};

  const responsaveis = metadataResponse?.responsaveis ?? [];

  return (
    <Card className="p-4 md:p-6 print-avoid-break">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Resumo do escopo
          </h2>
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
              value={account(ctaBancariaCasco)}
            />
          </Grid>
        </ViewCard>

        <ViewCard title="Sobre a empresa">
          <Grid>
            <Field
              label="Razão social"
              value={text(scope.sobreEmpresa?.razaoSocial)}
            />
            <Field
              label="Nome resumido"
              value={text(scope.sobreEmpresa?.nomeResumido)}
            />
            <Field label="CNPJ" value={formatCNPJ(scope.sobreEmpresa?.cnpj)} />
            <Field
              label="Inscrição estadual"
              value={text(scope.sobreEmpresa?.inscricaoEstadual)}
            />
            <Field
              label="Inscrição municipal"
              value={text(scope.sobreEmpresa?.inscricaoMunicipal)}
            />
            <Field
              label="Endereço completo do escritório"
              value={text(scope.sobreEmpresa?.enderecoCompletoEscritorio)}
            />
            <Field
              label="Endereço completo do armazém"
              value={text(scope.sobreEmpresa?.enderecoCompletoArmazem)}
            />
            <Field
              label="CNAE principal"
              value={text(scope.sobreEmpresa?.cnaePrincipal)}
            />
            <Field
              label="CNAEs secundários"
              value={text(scope.sobreEmpresa?.cnaeSecundario)}
            />
            <Field
              label="Regime de tributação"
              value={text(scope.sobreEmpresa?.regimeTributacao)}
            />
            <Field
              label="Modalidade RADAR"
              value={text(scope.sobreEmpresa?.modalidadeRadar)}
            />
            <Field
              label="Responsável comercial"
              value={
                <ResponsibleShow
                  value={scope.sobreEmpresa?.responsavelComercial}
                  options={responsaveis}
                />
              }
            />
          </Grid>
        </ViewCard>

        <ViewCard title="Contatos">
          <div className="grid gap-3">
            {scope.contatos?.map((c, index) => (
              <Grid key={index}>
                <Field label={`Contato ${index + 1} • Nome`} value={text(c.nome)} />
                <Field label="E-mail" value={text(c.email)} />
                <Field
                  label="Cargo / departamento"
                  value={text(c.cargoDepartamento)}
                />
                <Field label="Telefone" value={text(c.telefone)} />
              </Grid>
            ))}
          </div>
        </ViewCard>

        <ViewCard title="Operação">
          <Grid>
            <Field label="Tipos de operação" value={list(scope.operacao?.tipos)} />
          </Grid>

          {i ? (
            <>
              <Separator className="my-2" />
              <Grid>
                <Field
                  label="Analista DA"
                  value={list(
                    (i.analistaDA ?? []).map(
                      (id) =>
                        responsaveis.find((r) => r.id === id)?.nome ?? id,
                    ),
                  )}
                />
                <Field
                  label="Analista AE"
                  value={list(
                    (i.analistaAE ?? []).map(
                      (id) =>
                        responsaveis.find((r) => r.id === id)?.nome ?? id,
                    ),
                  )}
                />
                <Field
                  label="Produtos importados"
                  value={text(i.produtosImportados)}
                />
                <Field
                  label="Vínculo com exportador"
                  value={text(i.vinculoComExportador)}
                />
                <Field label="Locais de entrada" value={list(i.locaisEntrada)} />
                <Field
                  label="Outro local de entrada"
                  value={text(i.outroLocalEntrada)}
                />
                <Field
                  label="Locais de desembaraço"
                  value={list(i.locaisDesembaraco)}
                />
                <Field
                  label="Outro local de desembaraço"
                  value={text(i.outroLocalDesembaraco)}
                />
                <Field label="Necessidade DTA" value={text(i.necessidadeDta)} />
                <Field label="Necessidade DTC" value={text(i.necessidadeDtc)} />
                <Field
                  label="Necessidade LI / LPCO"
                  value={text(i.necessidadeLiLpco)}
                />
                <Field label="Anuências" value={list(i.anuencias)} />
                <Field
                  label="Outro órgão anuente"
                  value={text(i.outroOrgaoAnuente)}
                />
                <Field
                  label="Conta p/ impostos federais"
                  value={text(i.impostosFederais?.contaPagamento)}
                />
                <Field
                  label="Conta cliente p/ impostos federais"
                  value={account(i.impostosFederais?.dadosContaCliente)}
                />
                <Field label="Destinação" value={list(i.destinacao)} />
                <Field label="Subtipo de consumo" value={list(i.subtipoConsumo)} />
              </Grid>

              <div className="grid gap-3">
                {i.ncms
                  .filter((ncm) => ncm.codigo)
                  .map((ncm, index) => (
                    <Grid key={index}>
                      <Field
                        label={index === 0 ? "NCM principal" : `NCM ${index + 1}`}
                        value={text(ncm.codigo)}
                      />
                      <Field
                        label="Possui benefício"
                        value={text(ncm.possuiBeneficio)}
                      />
                      <Field
                        label="Descrição do benefício"
                        value={text(ncm.descricaoBeneficio)}
                      />
                    </Grid>
                  ))}
              </div>

              <Grid>
                <Field label="Observação NCM" value={i.observacaoNcms} />
              </Grid>

              <Separator className="my-2" />
              <h5 className="text-sm font-semibold">ICMS</h5>

              <Grid>
                <Field
                  label="Conta para pagamento"
                  value={text(i.icms?.contaPagamento)}
                />
                <Field label="Regime (geral)" value={text(i.icms?.regime)} />
                <Field
                  label="Conta cliente (ICMS)"
                  value={account(i.icms?.dadosContaCliente)}
                />
                <Field
                  label="Observações ICMS"
                  value={text(i.icms?.observacao)}
                />
              </Grid>

              <div className="grid gap-3">
                {Object.entries(i.icms?.porDestinacao ?? {})
                  .filter(
                    ([destinacao, detalhe]) =>
                      detalhe && i.destinacao.includes(destinacao),
                  )
                  .map(([destinacao, detalhe]) => (
                    <Card key={destinacao} className="gap-3 p-3">
                      <h6 className="text-sm font-semibold">
                        {ICMS_DESTINACAO_LABEL[destinacao] ?? destinacao}
                      </h6>
                      <Grid>
                        <Field label="Regime" value={text(detalhe?.regime)} />
                        <Field
                          label="Alíquota recolhida"
                          value={text(detalhe?.recolhida)}
                        />
                        <Field
                          label="Alíquota efetiva"
                          value={text(detalhe?.efetiva)}
                        />
                      </Grid>
                    </Card>
                  ))}
              </div>
            </>
          ) : null}

          {e ? (
            <>
              <Separator className="my-2" />
              <Grid>
                <Field
                  label="Produtos exportados"
                  value={text(e.produtosExportados)}
                />

                <div className="grid gap-3">
                  {e.ncms
                    .filter((ncm) => ncm.codigo)
                    .map((ncm, index) => (
                      <Grid key={index}>
                        <Field
                          label={
                            index === 0 ? "NCM principal" : `NCM ${index + 1}`
                          }
                          value={text(ncm.codigo)}
                        />
                        <Field
                          label="Possui benefício"
                          value={text(ncm.possuiBeneficio)}
                        />
                        <Field
                          label="Descrição do benefício"
                          value={text(ncm.descricaoBeneficio)}
                        />
                      </Grid>
                    ))}
                </div>

                <Grid>
                  <Field label="Observação NCM" value={e.observacaoNcms} />
                </Grid>

                <Field label="Destinação" value={list(e.destinacao)} />
                <Field label="Subtipo de consumo" value={list(e.subtipoConsumo)} />
              </Grid>
            </>
          ) : null}
        </ViewCard>

        <ViewCard title="Serviços de importação">
          {si && hasImportServices ? (
            <ImportServicesView services={si} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem serviços de importação contratados.
            </p>
          )}
        </ViewCard>

        <ViewCard title="Serviços de exportação">
          {se && hasExportServices ? (
            <ExportServicesView services={se} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem serviços de exportação contratados.
            </p>
          )}
        </ViewCard>

        <ViewCard title="Financeiro">
          <Grid>
            <Field
              label="Dados bancários para devolução de saldo"
              value={list(
                (
                  scope.financeiro?.dadosBancariosClienteDevolucaoSaldo ?? []
                )
                  .map((conta) => account(conta))
                  .filter(Boolean) as string[],
              )}
            />
            <Field
              label="Observações financeiras"
              value={text(scope.financeiro?.observacoesFinanceiro)}
            />
          </Grid>
        </ViewCard>

        <ViewCard title="Informações gerais">
          <Field label="" value={text(scope.geral?.descricao)} />
        </ViewCard>
      </div>
    </Card>
  );
}

export default function ScopeViewPage() {
  const { cnpj, id } = useParams<{ cnpj: string; id: string }>();

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
      <div className="w-full h-full flex flex-col justify-center items-center gap-2">
        <RotateCw className="h-10 w-10 animate-spin" />
        Carregando Escopo...
      </div>
    );
  }

  if (scopeError || !selectedScope) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-2">
        <p className="font-medium">Erro ao carregar o Escopo.</p>
        <Button asChild className="mt-3">
          <Link href={`/scope/list`}>Voltar para escopos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 w-full" id="scope-view-layout">
      <div className="p-4 print-avoid-break">
        <div className="flex flex-row items-center justify-between gap-3">

          {createdBy && (
            <p className="mt-5 text-sm text-muted-foreground">
              Criado por {createdBy.nome}
            </p>
          )}

          <ScopeViewActions cnpj={cnpj} id={id} />
        </div>
      </div>

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