"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, RotateCw, XCircle } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";
import { useScope, useScopeVersions } from "@/lib/api/hooks/use-scope-api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCNPJ } from "@/utils/format";
import { Divider } from "@/components/ui/form-layout";
import { cn } from "@/lib/utils";

function formatISO(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value?: number | string | null) {
  if (value == null || value === "") return "-";
  return typeof value === "number" ? `${value}%` : `${value}%`;
}

function formatText(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.trim() === "") return "-";
  if (Array.isArray(value) && value.length === 0) return "-";
  return String(value);
}

function formatArray(values?: Array<string | number | null> | null) {
  if (!values || values.length === 0) return "-";
  const parsed = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  return parsed.length ? parsed.join(", ") : "-";
}

function formatAccount(data?: {
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
} | null) {
  if (!data) return "-";

  const banco = formatText(data.banco);
  const agencia = formatText(data.agencia);
  const conta = formatText(data.conta);

  if (banco === "-" && agencia === "-" && conta === "-") return "-";
  return `Banco: ${banco} • Agência: ${agencia} • Conta: ${conta}`;
}

function regimeWithDetail(regime?: string | null, detalhe?: string | null) {
  const r = formatText(regime);
  const d = formatText(detalhe);
  if (r === "-" && d === "-") return "-";
  if (d === "-") return r;
  return `${r} • ${d}`;
}

function ViewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 print-avoid-break">
      <div>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ViewCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 md:p-5 print-avoid-break", className)}>
      {title ? <h4 className="mb-4 text-sm font-semibold">{title}</h4> : null}
      <div className="grid gap-4">{children}</div>
    </Card>
  );
}

function FieldGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}) {
  const colsClass =
    cols === 1
      ? "md:grid-cols-1"
      : cols === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2";

  return <div className={cn("grid gap-3 print:grid-cols-1", colsClass)}>{children}</div>;
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3", className)}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium wrap-break-word">{value}</div>
    </div>
  );
}

function BooleanBadge({ value }: { value: boolean | null | undefined }) {
  if (value == null) {
    return <Badge variant="secondary">Não informado</Badge>;
  }

  return value ? (
    <Badge className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-600">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Habilitado
    </Badge>
  ) : (
    <Badge variant="secondary" className="inline-flex items-center gap-1">
      <XCircle className="h-3.5 w-3.5" />
      Desabilitado
    </Badge>
  );
}

function ScopeDetails({
  scope,
  versionLabel,
}: {
  scope: EscopoForm;
  versionLabel: string;
}) {
  const importacao = scope.operacao?.importacao;
  const exportacao = scope.operacao?.exportacao;
  const servicosImportacao = scope.servicos?.importacao;
  const servicosExportacao = scope.servicos?.exportacao;

  return (
    <div className="grid gap-4">
      <Card className="p-4 md:p-6 print-avoid-break">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Resumo do escopo</h2>
            <p className="text-sm text-muted-foreground">
              Visualização consolidada dos dados cadastrados.
            </p>
          </div>
          <Badge>{versionLabel}</Badge>
        </div>

        <Divider />

        <div className="mt-4 grid gap-6">
          <ViewSection title="Informações fixas">
            <FieldGrid>
              <Field
                label="Salário mínimo vigente"
                value={formatCurrency(scope.informacoesFixas?.salarioMinimoVigente)}
              />
              <Field
                label="Dados bancários CASCO"
                value={formatAccount(scope.informacoesFixas?.dadosBancariosCasco)}
              />
            </FieldGrid>
          </ViewSection>

          <ViewSection title="Sobre a empresa">
            <FieldGrid>
              <Field label="Razão social" value={formatText(scope.sobreEmpresa?.razaoSocial)} />
              <Field label="CNPJ" value={formatCNPJ(scope.sobreEmpresa?.cnpj) || "-"} />
              <Field
                label="Inscrição estadual"
                value={formatText(scope.sobreEmpresa?.inscricaoEstadual)}
              />
              <Field
                label="Inscrição municipal"
                value={formatText(scope.sobreEmpresa?.inscricaoMunicipal)}
              />
              <Field
                label="Endereço completo do escritório"
                value={formatText(scope.sobreEmpresa?.enderecoCompletoEscritorio)}
              />
              <Field
                label="Endereço completo do armazém"
                value={formatText(scope.sobreEmpresa?.enderecoCompletoArmazem)}
              />
              <Field label="CNAE principal" value={formatText(scope.sobreEmpresa?.cnaePrincipal)} />
              <Field
                label="CNAE secundário"
                value={formatText(scope.sobreEmpresa?.cnaeSecundario)}
              />
              <Field
                label="Regime de tributação"
                value={formatText(scope.sobreEmpresa?.regimeTributacao)}
              />
              <Field
                label="Responsável comercial"
                value={formatText(scope.sobreEmpresa?.responsavelComercial)}
              />
            </FieldGrid>
          </ViewSection>

          <ViewSection title="Contatos">
            {scope.contatos?.length ? (
              <div className="grid gap-3">
                {scope.contatos.map((c, i) => (
                  <ViewCard key={i} title={`Contato ${i + 1}`}>
                    <FieldGrid>
                      <Field label="Nome" value={formatText(c.nome)} />
                      <Field label="E-mail" value={formatText(c.email)} />
                      <Field
                        label="Cargo / departamento"
                        value={formatText(c.cargoDepartamento)}
                      />
                      <Field label="Telefone" value={formatText(c.telefone)} />
                    </FieldGrid>
                  </ViewCard>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum contato informado.</p>
            )}
          </ViewSection>

          <ViewSection title="Operação">
            <ViewCard title="Configuração geral">
              <FieldGrid>
                <Field label="Tipos de operação" value={formatArray(scope.operacao?.tipos)} />
                <Field label="Importação" value={importacao ? "Configurada" : "-"} />
                <Field label="Exportação" value={exportacao ? "Configurada" : "-"} />
              </FieldGrid>
            </ViewCard>

            <ViewCard title="Importação">
              <FieldGrid>
                <Field label="Analista DA" value={formatText(importacao?.analistaDA)} />
                <Field label="Analista AE" value={formatText(importacao?.analistaAE)} />
                <Field
                  label="Produtos importados"
                  value={formatText(importacao?.produtosImportados)}
                />
                <Field
                  label="Vínculo com exportador"
                  value={formatText(importacao?.vinculoComExportador)}
                />
                <Field
                  label="Locais de entrada"
                  value={formatArray(importacao?.locaisEntrada)}
                />
                <Field
                  label="Outro local de entrada"
                  value={formatText(importacao?.outroLocalEntrada)}
                />
                <Field
                  label="Armazéns de liberação"
                  value={formatArray(importacao?.armazensLiberacao)}
                />
                <Field
                  label="Outro armazém de liberação"
                  value={formatText(importacao?.outroArmazemLiberacao)}
                />
                <Field
                  label="Necessidade DTC / DTA"
                  value={formatText(importacao?.necessidadeDtcDta)}
                />
                <Field
                  label="Necessidade LI / LPCO"
                  value={formatText(importacao?.necessidadeLiLpco)}
                />
                <Field label="Anuências" value={formatArray(importacao?.anuencias)} />
                <Field label="Destinação" value={formatText(importacao?.destinacao)} />
                <Field
                  label="Subtipo de consumo"
                  value={formatText(importacao?.subtipoConsumo)}
                />
              </FieldGrid>

              <Divider />

              <div className="grid gap-3">
                <h5 className="text-sm font-semibold">NCMs</h5>
                {importacao?.ncms?.length ? (
                  <div className="grid gap-3">
                    {importacao.ncms.map((ncm, index) => (
                      <FieldGrid key={index}>
                        <Field label={`NCM ${index + 1}`} value={formatText(ncm.codigo)} />
                        <Field label="Possui NVE" value={formatText(ncm.possuiNve)} />
                      </FieldGrid>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum NCM informado.</p>
                )}
              </div>

              <Divider />

              <div className="grid gap-4">
                <h5 className="text-sm font-semibold">Impostos federais</h5>
                <FieldGrid>
                  <Field
                    label="Conta de pagamento"
                    value={formatText(importacao?.impostosFederais?.contaPagamento)}
                  />
                  <Field
                    label="Dados da conta do cliente"
                    value={formatAccount(importacao?.impostosFederais?.dadosContaCliente)}
                  />
                  <Field
                    label="II"
                    value={regimeWithDetail(
                      importacao?.impostosFederais?.ii?.regime,
                      importacao?.impostosFederais?.ii?.detalheBeneficio
                    )}
                  />
                  <Field
                    label="IPI"
                    value={regimeWithDetail(
                      importacao?.impostosFederais?.ipi?.regime,
                      importacao?.impostosFederais?.ipi?.detalheBeneficio
                    )}
                  />
                  <Field
                    label="PIS"
                    value={regimeWithDetail(
                      importacao?.impostosFederais?.pis?.regime,
                      importacao?.impostosFederais?.pis?.detalheBeneficio
                    )}
                  />
                  <Field
                    label="COFINS"
                    value={regimeWithDetail(
                      importacao?.impostosFederais?.cofins?.regime,
                      importacao?.impostosFederais?.cofins?.detalheBeneficio
                    )}
                  />
                </FieldGrid>

                <h5 className="text-sm font-semibold">AFRMM</h5>
                <FieldGrid>
                  <Field
                    label="Conta de pagamento"
                    value={formatText(importacao?.afrmm?.contaPagamento)}
                  />
                  <Field
                    label="Dados da conta do cliente"
                    value={formatAccount(importacao?.afrmm?.dadosContaCliente)}
                  />
                  <Field label="Regime" value={formatText(importacao?.afrmm?.regime)} />
                  <Field
                    label="Detalhe do benefício"
                    value={formatText(importacao?.afrmm?.detalheBeneficio)}
                  />
                </FieldGrid>

                <h5 className="text-sm font-semibold">ICMS</h5>
                <FieldGrid>
                  <Field
                    label="Conta de pagamento"
                    value={formatText(importacao?.icms?.contaPagamento)}
                  />
                  <Field
                    label="Dados da conta do cliente"
                    value={formatAccount(importacao?.icms?.dadosContaCliente)}
                  />
                  <Field label="Regime" value={formatText(importacao?.icms?.regime)} />
                  <Field label="Recolhida" value={formatPercent(importacao?.icms?.recolhida)} />
                  <Field label="Efetiva" value={formatPercent(importacao?.icms?.efetiva)} />
                </FieldGrid>
              </div>
            </ViewCard>

            <ViewCard title="Exportação">
              <FieldGrid>
                <Field label="Analista DA" value={formatText(exportacao?.analistaDA)} />
                <Field label="Analista AE" value={formatText(exportacao?.analistaAE)} />
                <Field
                  label="Produtos exportados"
                  value={formatText(exportacao?.produtosExportados)}
                />
                <Field label="NCMs" value={formatArray(exportacao?.ncms?.map((n) => String(n)))} />
                <Field
                  label="Portos / fronteiras"
                  value={formatArray(exportacao?.portosFronteiras)}
                />
                <Field label="Outro porto" value={formatText(exportacao?.outroPorto)} />
                <Field
                  label="Outra fronteira"
                  value={formatText(exportacao?.outraFronteira)}
                />
                <Field label="Destinação" value={formatText(exportacao?.destinacao)} />
                <Field
                  label="Subtipo de consumo"
                  value={formatText(exportacao?.subtipoConsumo)}
                />
              </FieldGrid>
            </ViewCard>
          </ViewSection>

          <ViewSection title="Serviços">
            <ViewCard title="Importação">
              <FieldGrid>
                <Field
                  label="Despacho aduaneiro de importação"
                  value={
                    <BooleanBadge
                      value={servicosImportacao?.despachoAduaneiroImportacao?.habilitado}
                    />
                  }
                />
                <Field
                  label="Tipo de valor"
                  value={formatText(servicosImportacao?.despachoAduaneiroImportacao?.tipoValor)}
                />
                <Field
                  label="Valor"
                  value={formatCurrency(servicosImportacao?.despachoAduaneiroImportacao?.valor)}
                />
                <Field
                  label="Responsável"
                  value={formatText(servicosImportacao?.despachoAduaneiroImportacao?.responsavel)}
                />

                <Field
                  label="Preposto"
                  value={<BooleanBadge value={servicosImportacao?.preposto?.habilitado} />}
                />
                <Field
                  label="Valor do preposto"
                  value={formatCurrency(servicosImportacao?.preposto?.valor)}
                />
                <Field
                  label="Incluso no desembaraço CASCO"
                  value={formatText(servicosImportacao?.preposto?.inclusoNoDesembaracoCasco)}
                />

                <Field
                  label="Emissão LI / LPCO"
                  value={<BooleanBadge value={servicosImportacao?.emissaoLiLpco?.habilitado} />}
                />
                <Field
                  label="Valor emissão LI / LPCO"
                  value={formatCurrency(servicosImportacao?.emissaoLiLpco?.valor)}
                />

                <Field
                  label="Cadastro catálogo de produtos"
                  value={
                    <BooleanBadge value={servicosImportacao?.cadastroCatalogoProdutos?.habilitado} />
                  }
                />
                <Field
                  label="Valor catálogo de produtos"
                  value={formatCurrency(servicosImportacao?.cadastroCatalogoProdutos?.valor)}
                />

                <Field
                  label="Assessoria"
                  value={<BooleanBadge value={servicosImportacao?.assessoria?.habilitado} />}
                />
                <Field
                  label="Tipo de valor assessoria"
                  value={formatText(servicosImportacao?.assessoria?.tipoValor)}
                />
                <Field
                  label="Valor assessoria"
                  value={formatCurrency(servicosImportacao?.assessoria?.valor)}
                />
                <Field
                  label="Responsável assessoria"
                  value={formatText(servicosImportacao?.assessoria?.responsavel)}
                />

                <Field
                  label="Frete internacional"
                  value={<BooleanBadge value={servicosImportacao?.freteInternacional?.habilitado} />}
                />
                <Field
                  label="PTAX negociado"
                  value={formatText(servicosImportacao?.freteInternacional?.ptaxNegociado)}
                />
                <Field
                  label="Responsável frete internacional"
                  value={formatText(servicosImportacao?.freteInternacional?.responsavel)}
                />

                <Field
                  label="Seguro internacional"
                  value={<BooleanBadge value={servicosImportacao?.seguroInternacional?.habilitado} />}
                />
                <Field
                  label="Valor negociado"
                  value={formatCurrency(servicosImportacao?.seguroInternacional?.valorNegociado)}
                />
                <Field
                  label="Percentual sobre CFR"
                  value={formatPercent(servicosImportacao?.seguroInternacional?.percentualSobreCfr)}
                />
                <Field
                  label="Data inclusão da apólice"
                  value={formatDate(servicosImportacao?.seguroInternacional?.dataInclusaoApolice)}
                />
                <Field
                  label="Descrição complementar"
                  value={formatText(servicosImportacao?.seguroInternacional?.descricaoComplementar)}
                />
                <Field
                  label="Responsável seguro"
                  value={formatText(servicosImportacao?.seguroInternacional?.responsavel)}
                />

                <Field
                  label="Frete rodoviário"
                  value={<BooleanBadge value={servicosImportacao?.freteRodoviario?.habilitado} />}
                />
                <Field
                  label="Modalidade frete rodoviário"
                  value={formatText(servicosImportacao?.freteRodoviario?.modalidade)}
                />
                <Field
                  label="Responsável frete rodoviário"
                  value={formatText(servicosImportacao?.freteRodoviario?.responsavel)}
                />

                {/*O campo de regime especial pode ser um array de strings ou um array de objetos com nomeRegime*/}
                <Field
                  label="Regime especial"
                  value={formatArray(servicosImportacao?.regimeEspecial.map((r) => String(r.nomeRegime)))}
                />

                <Field
                  label="Emissão NFe"
                  value={<BooleanBadge value={servicosImportacao?.emissaoNfe?.habilitado} />}
                />
                <Field
                  label="Valor emissão NFe"
                  value={formatCurrency(servicosImportacao?.emissaoNfe?.valor)}
                />
              </FieldGrid>
            </ViewCard>

            <ViewCard title="Exportação">
              <FieldGrid>
                <Field
                  label="Despacho aduaneiro de exportação"
                  value={
                    <BooleanBadge
                      value={servicosExportacao?.despachoAduaneiroExportacao?.habilitado}
                    />
                  }
                />
                <Field
                  label="Tipo de valor"
                  value={formatText(servicosExportacao?.despachoAduaneiroExportacao?.tipoValor)}
                />
                <Field
                  label="Valor"
                  value={formatCurrency(servicosExportacao?.despachoAduaneiroExportacao?.valor)}
                />
                <Field
                  label="Responsável"
                  value={formatText(servicosExportacao?.despachoAduaneiroExportacao?.responsavel)}
                />

                <Field
                  label="Preposto"
                  value={<BooleanBadge value={servicosExportacao?.preposto?.habilitado} />}
                />
                <Field
                  label="Valor do preposto"
                  value={formatCurrency(servicosExportacao?.preposto?.valor)}
                />
                <Field
                  label="Incluso no desembaraço CASCO"
                  value={formatText(servicosExportacao?.preposto?.inclusoNoDesembaracoCasco)}
                />

                <Field
                  label="Certificado de origem"
                  value={<BooleanBadge value={servicosExportacao?.certificadoOrigem?.habilitado} />}
                />
                <Field
                  label="Valor certificado de origem"
                  value={formatCurrency(servicosExportacao?.certificadoOrigem?.valor)}
                />

                <Field
                  label="Certificado fitossanitário"
                  value={
                    <BooleanBadge value={servicosExportacao?.certificadoFitossanitario?.habilitado} />
                  }
                />
                <Field
                  label="Valor certificado fitossanitário"
                  value={formatCurrency(servicosExportacao?.certificadoFitossanitario?.valor)}
                />

                <Field
                  label="Outros certificados"
                  value={<BooleanBadge value={servicosExportacao?.outrosCertificados?.habilitado} />}
                />

                {/*O campo de itens de outros certificados pode ser um array de strings ou um array de objetos com nomeItem*/}
                <Field
                  label="Itens de outros certificados"
                  value={formatArray(servicosExportacao?.outrosCertificados?.itens.map((i) => String(i.chave)))}
                />

                <Field
                  label="Assessoria"
                  value={<BooleanBadge value={servicosExportacao?.assessoria?.habilitado} />}
                />
                <Field
                  label="Tipo de valor assessoria"
                  value={formatText(servicosExportacao?.assessoria?.tipoValor)}
                />
                <Field
                  label="Valor assessoria"
                  value={formatCurrency(servicosExportacao?.assessoria?.valor)}
                />
                <Field
                  label="Responsável assessoria"
                  value={formatText(servicosExportacao?.assessoria?.responsavel)}
                />

                <Field
                  label="Frete internacional"
                  value={<BooleanBadge value={servicosExportacao?.freteInternacional?.habilitado} />}
                />
                <Field
                  label="PTAX negociado"
                  value={formatText(servicosExportacao?.freteInternacional?.ptaxNegociado)}
                />
                <Field
                  label="Responsável frete internacional"
                  value={formatText(servicosExportacao?.freteInternacional?.responsavel)}
                />

                <Field
                  label="Seguro internacional"
                  value={<BooleanBadge value={servicosExportacao?.seguroInternacional?.habilitado} />}
                />
                <Field
                  label="Valor negociado"
                  value={formatCurrency(servicosExportacao?.seguroInternacional?.valorNegociado)}
                />
                <Field
                  label="Percentual sobre CFR"
                  value={formatPercent(servicosExportacao?.seguroInternacional?.percentualSobreCfr)}
                />
                <Field
                  label="Data inclusão da apólice"
                  value={formatDate(servicosExportacao?.seguroInternacional?.dataInclusaoApolice)}
                />
                <Field
                  label="Descrição complementar"
                  value={formatText(servicosExportacao?.seguroInternacional?.descricaoComplementar)}
                />
                <Field
                  label="Responsável seguro"
                  value={formatText(servicosExportacao?.seguroInternacional?.responsavel)}
                />

                <Field
                  label="Frete rodoviário"
                  value={<BooleanBadge value={servicosExportacao?.freteRodoviario?.habilitado} />}
                />
                <Field
                  label="Modalidade frete rodoviário"
                  value={formatText(servicosExportacao?.freteRodoviario?.modalidade)}
                />
                <Field
                  label="Responsável frete rodoviário"
                  value={formatText(servicosExportacao?.freteRodoviario?.responsavel)}
                />

                {/*O campo de regime especial pode ser um array de strings ou um array de objetos com nomeRegime*/}
                <Field
                  label="Regime especial"
                  value={formatArray(servicosExportacao?.regimeEspecial.map((r) => String(r.nomeRegime)))}
                />
              </FieldGrid>
            </ViewCard>
          </ViewSection>

          <ViewSection title="Financeiro">
            <FieldGrid>
              <Field
                label="Dados bancários para devolução de saldo"
                value={formatAccount(scope.financeiro?.dadosBancariosClienteDevolucaoSaldo)}
              />
              <Field
                label="Observações financeiras"
                value={formatText(scope.financeiro?.observacoesFinanceiro)}
              />
            </FieldGrid>
          </ViewSection>
        </div>
      </Card>
    </div>
  );
}

export default function ScopeViewPage() {
  const { cnpj, id } = useParams<{ cnpj: string; id: string }>();
  const { data: scopeResponse, isLoading: loadingScope, error: scopeError } = useScope(id);
  const { data: versionsResponse, isLoading: loadingVersions } = useScopeVersions(id);

  const [selectedVersion, setSelectedVersion] = useState<string>("draft");

  const versions = useMemo(
    () => [...(versionsResponse ?? [])].sort((a, b) => b.version_number - a.version_number),
    [versionsResponse]
  );

  const selectedScope = useMemo(() => {
    const draft = scopeResponse?.draft;
    if (!draft) return null;
    if (selectedVersion === "draft") return draft;
    const version = versions.find((v) => String(v.version_number) === selectedVersion);
    return version?.data ?? draft;
  }, [scopeResponse?.draft, selectedVersion, versions]);

  if (loadingScope || loadingVersions) {
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
        <Button asChild className="mt-3">
          <Link href={`/clients/${cnpj}/scopes`}>Voltar para escopos</Link>
        </Button>
      </Card>
    );
  }

  const label = selectedVersion === "draft" ? "Draft atual" : `Versão v${selectedVersion}`;

  return (
    <div className="grid gap-4" id="scope-view-layout">
      <Card className="p-4 print-avoid-break">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Visualização do Escopo</h1>
            <p className="text-sm text-muted-foreground">
              Documento em modo leitura para acompanhamento operacional.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button asChild variant="outline">
              <Link href={`/clients/${cnpj}/scopes`}>Voltar</Link>
            </Button>
            <Button onClick={() => window.print()}>Baixar em PDF</Button>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
          <p className="text-sm text-muted-foreground">Versões disponíveis:</p>
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-full md:w-90">
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft atual</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.version_number} value={String(v.version_number)}>
                  v{v.version_number} • {formatISO(v.published_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <ScopeDetails scope={selectedScope} versionLabel={label} />

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