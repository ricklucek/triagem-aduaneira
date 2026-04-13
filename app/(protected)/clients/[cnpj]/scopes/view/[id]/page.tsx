"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, RotateCw, XCircle } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";
import { useScope, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCNPJ } from "@/utils/format";
import { ResponsibleShow } from "@/components/ResponsibleShow";

const text = (v: unknown) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0)
    ? "-"
    : String(v);
const currency = (v?: number | null) =>
  v == null || Number.isNaN(v)
    ? "-"
    : new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
const date = (v?: string | null) =>
  !v ? "-" : new Date(v).toLocaleDateString("pt-BR");
const list = (v?: Array<string | number | null> | null) =>
  !v?.length ? "-" : v.filter(Boolean).join(", ");
const account = (
  v?: {
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  } | null,
) =>
  !v
    ? "-"
    : `Banco: ${text(v.banco)} • Agência: ${text(v.agencia)} • Conta: ${text(v.conta)}`;
const boolBadge = (value?: boolean | null) =>
  value ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600">
      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
      Habilitado
    </Badge>
  ) : (
    <Badge variant="secondary">
      <XCircle className="mr-1 h-3.5 w-3.5" />
      Desabilitado
    </Badge>
  );

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium wrap-break-word">{value}</div>
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

  const { data: metadataResponse } = useScopeMetadata();

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
              value={currency(scope.informacoesFixas?.salarioMinimoVigente)}
            />
            <Field
              label="Dados bancários CASCO"
              value={account(scope.informacoesFixas?.dadosBancariosCasco)}
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
            <Field
              label="CNPJ"
              value={formatCNPJ(scope.sobreEmpresa?.cnpj) || "-"}
            />
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
              label="Responsável comercial"
              value={<ResponsibleShow value={scope.sobreEmpresa?.responsavelComercial} options={responsaveis} />}
            />
          </Grid>
        </ViewCard>
        <ViewCard title="Contatos">
          <div className="grid gap-3">
            {scope.contatos?.map((c, index) => (
              <Grid key={index}>
                <Field
                  label={`Contato ${index + 1} • Nome`}
                  value={text(c.nome)}
                />
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
            <Field
              label="Tipos de operação"
              value={list(scope.operacao?.tipos)}
            />
            <Field label="Importação" value={i ? "Configurada" : "-"} />
            <Field label="Exportação" value={e ? "Configurada" : "-"} />
          </Grid>
          {i ? (
            <>
              <Separator className="my-2" />
              <Grid>
                <Field label="Analista DA" value={<ResponsibleShow value={i.analistaDA} options={responsaveis} />} />
                <Field label="Analista AE" value={<ResponsibleShow value={i.analistaAE} options={responsaveis} />} />
                <Field
                  label="Produtos importados"
                  value={text(i.produtosImportados)}
                />
                <Field
                  label="Vínculo com exportador"
                  value={text(i.vinculoComExportador)}
                />
                <Field
                  label="Locais de desembaraço"
                  value={list(i.locaisDesembaraco)}
                />
                <Field
                  label="Outro local de desembaraço"
                  value={text(i.outroLocalDesembaraco)}
                />
                <Field
                  label="Locais de despacho"
                  value={list(i.locaisDespacho)}
                />
                <Field
                  label="Outro local de despacho"
                  value={text(i.outroLocalDespacho)}
                />
                <Field
                  label="Necessidade DTA"
                  value={text(i.necessidadeDta)}
                />
                <Field
                  label="Necessidade DTC"
                  value={text(i.necessidadeDtc)}
                />
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
                <Field
                  label="Subtipo de consumo"
                  value={list(i.subtipoConsumo)}
                />
              </Grid>
              <div className="grid gap-3">
                {i.ncms
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
                <Field
                  label="Observação NCM"
                  value={i.observacaoNcms}
                />
              </Grid>
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
                  <Field
                    label="Observação NCM"
                    value={e.observacaoNcms}
                  />
                </Grid>
                <Field label="Destinação" value={list(e.destinacao)} />
                <Field
                  label="Subtipo de consumo"
                  value={list(e.subtipoConsumo)}
                />
              </Grid>
            </>
          ) : null}
        </ViewCard>
        <ViewCard title="Serviços de importação">
          {si ? (
            <Grid>
              <Field
                label="Despacho aduaneiro importação"
                value={boolBadge(si.despachoAduaneiroImportacao?.habilitado)}
              />
              <Field
                label="Tipo de valor"
                value={text(si.despachoAduaneiroImportacao?.tipoValor)}
              />
              <Field
                label="Valor"
                value={currency(si.despachoAduaneiroImportacao?.valor)}
              />
              <Field
                label="Última atualização"
                value={date(si.despachoAduaneiroImportacao?.ultimaAtualizacao)}
              />
              <Field
                label="Preposto"
                value={boolBadge(si.preposto?.habilitado)}
              />
              <Field
                label="Valor do preposto"
                value={currency(si.preposto?.prepostoSelecionado?.valor)}
              />
              <Field
                label="Incluso no desembaraço CASCO"
                value={text(si.preposto?.inclusoNoDesembaracoCasco)}
              />
              <Field
                label="Cidades/portos/fronteiras"
                value={list(si.preposto?.cidadesLiberacao)}
              />
              <Field
                label="Outro porto"
                value={text(si.preposto?.outroPorto)}
              />
              <Field
                label="Outra fronteira"
                value={text(si.preposto?.outraFronteira)}
              />
              <Field
                label="Preposto selecionado"
                value={text(si.preposto?.prepostoSelecionado?.nome)}
              />
              <Field
                label="Contato do preposto"
                value={text(si.preposto?.prepostoSelecionado?.contatoNome)}
              />
              <Field
                label="Telefone do preposto"
                value={text(si.preposto?.prepostoSelecionado?.telefone)}
              />
              <Field
                label="Valor do preposto selecionado"
                value={currency(si.preposto?.prepostoSelecionado?.valor)}
              />
              <Field
                label="Emissão LI/LPCO"
                value={boolBadge(si.emissaoLiLpco?.habilitado)}
              />
              <Field
                label="Valor emissão LI/LPCO"
                value={currency(si.emissaoLiLpco?.valor)}
              />
              <Field
                label="Cadastro de catálogo de produtos"
                value={boolBadge(si.cadastroCatalogoProdutos?.habilitado)}
              />
              <Field
                label="Valor cadastro de catálogo"
                value={currency(si.cadastroCatalogoProdutos?.valor)}
              />
              <Field
                label="Assessoria"
                value={boolBadge(si.assessoria?.habilitado)}
              />
              <Field
                label="Tipo de valor assessoria"
                value={text(si.assessoria?.tipoValor)}
              />
              <Field
                label="Valor assessoria"
                value={currency(si.assessoria?.valor)}
              />
              <Field
                label="Última atualização assessoria"
                value={date(si.assessoria?.ultimaAtualizacao)}
              />
              <Field
                label="Frete internacional"
                value={boolBadge(si.freteInternacional?.habilitado)}
              />
              <Field
                label="Modalidade frete internacional"
                value={text(si.freteInternacional?.modalidade)}
              />
              <Field
                label="% PTAX negociada"
                value={text(si.freteInternacional?.ptaxNegociado)}
              />
              <Field
                label="Seguro internacional"
                value={boolBadge(si.seguroInternacional?.habilitado)}
              />
              <Field
                label="Percentual sobre CFR"
                value={text(si.seguroInternacional?.percentualSobreCfr)}
              />
              <Field
                label="Data inclusão da apólice"
                value={date(si.seguroInternacional?.dataInclusaoApolice)}
              />
              <Field
                label="Descrição complementar"
                value={text(si.seguroInternacional?.descricaoComplementar)}
              />
              <Field
                label="Frete rodoviário"
                value={boolBadge(si.freteRodoviario?.habilitado)}
              />
              <Field
                label="Modalidade frete rodoviário"
                value={text(si.freteRodoviario?.modalidade)}
              />
              <Field
                label="Observação geral"
                value={text(si.freteRodoviario?.observacaoGeral)}
              />
              <Field
                label="Regime especial"
                value={list(si.regimeEspecial?.map((r) => r.nomeRegime))}
              />
              <Field
                label="Emissão NFe"
                value={boolBadge(si.emissaoNfe?.habilitado)}
              />
              <Field
                label="Valor emissão NFe"
                value={currency(si.emissaoNfe?.valor)}
              />
            </Grid>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem serviços de importação.
            </p>
          )}
        </ViewCard>
        <ViewCard title="Serviços de exportação">
          {se ? (
            <Grid>
              <Field
                label="Despacho aduaneiro exportação"
                value={boolBadge(se.despachoAduaneiroExportacao?.habilitado)}
              />
              <Field
                label="Tipo de valor"
                value={text(se.despachoAduaneiroExportacao?.tipoValor)}
              />
              <Field
                label="Valor"
                value={currency(se.despachoAduaneiroExportacao?.valor)}
              />
              <Field
                label="Preposto"
                value={boolBadge(se.preposto?.habilitado)}
              />
              <Field
                label="Valor do preposto"
                value={currency(se.preposto?.prepostoSelecionado?.valor)}
              />
              <Field
                label="Incluso no desembaraço CASCO"
                value={text(se.preposto?.inclusoNoDesembaracoCasco)}
              />
              <Field
                label="Cidades/portos/fronteiras"
                value={list(se.preposto?.cidadesLiberacao)}
              />
              <Field
                label="Outro porto"
                value={text(se.preposto?.outroPorto)}
              />
              <Field
                label="Outra fronteira"
                value={text(se.preposto?.outraFronteira)}
              />
              <Field
                label="Preposto selecionado"
                value={text(se.preposto?.prepostoSelecionado?.nome)}
              />
              <Field
                label="Contato do preposto"
                value={text(se.preposto?.prepostoSelecionado?.contatoNome)}
              />
              <Field
                label="Telefone do preposto"
                value={text(se.preposto?.prepostoSelecionado?.telefone)}
              />
              <Field
                label="Valor do preposto selecionado"
                value={currency(se.preposto?.prepostoSelecionado?.valor)}
              />
              <Field
                label="Certificado de origem"
                value={boolBadge(se.certificadoOrigem?.habilitado)}
              />
              <Field
                label="Valor certificado de origem"
                value={currency(se.certificadoOrigem?.valor)}
              />
              <Field
                label="Certificado fitossanitário"
                value={boolBadge(se.certificadoFitossanitario?.habilitado)}
              />
              <Field
                label="Valor certificado fitossanitário"
                value={currency(se.certificadoFitossanitario?.valor)}
              />
              <Field
                label="Outros certificados"
                value={boolBadge(se.outrosCertificados?.habilitado)}
              />
              <Field
                label="Itens de outros certificados"
                value={list(se.outrosCertificados?.itens?.map((i) => i.chave))}
              />
              <Field
                label="Assessoria"
                value={boolBadge(se.assessoria?.habilitado)}
              />
              <Field
                label="Tipo de valor assessoria"
                value={text(se.assessoria?.tipoValor)}
              />
              <Field
                label="Valor assessoria"
                value={currency(se.assessoria?.valor)}
              />
              <Field
                label="Última atualização assessoria"
                value={date(se.assessoria?.ultimaAtualizacao)}
              />
              <Field
                label="Frete internacional"
                value={boolBadge(se.freteInternacional?.habilitado)}
              />
              <Field
                label="% PTAX negociada"
                value={text(se.freteInternacional?.ptaxNegociado)}
              />
              <Field
                label="Seguro internacional"
                value={boolBadge(se.seguroInternacional?.habilitado)}
              />
              <Field
                label="Valor mínimo"
                value={currency(se.seguroInternacional?.valorMinimo)}
              />
              <Field
                label="Percentual sobre CFR"
                value={text(se.seguroInternacional?.percentualSobreCfr)}
              />
              <Field
                label="Data inclusão da apólice"
                value={date(se.seguroInternacional?.dataInclusaoApolice)}
              />
              <Field
                label="Descrição complementar"
                value={text(se.seguroInternacional?.descricaoComplementar)}
              />
              <Field
                label="Frete rodoviário"
                value={boolBadge(se.freteRodoviario?.habilitado)}
              />
              <Field
                label="Modalidade frete rodoviário"
                value={text(se.freteRodoviario?.modalidade)}
              />
              <Field
                label="Observação geral"
                value={text(se.freteRodoviario?.observacaoGeral)}
              />
              <Field
                label="Regime especial"
                value={list(se.regimeEspecial?.map((r) => r.nomeRegime))}
              />
            </Grid>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem serviços de exportação.
            </p>
          )}
        </ViewCard>
        <ViewCard title="Financeiro">
          <Grid>
            <Field
              label="Dados bancários para devolução de saldo"
              value={account(
                scope.financeiro?.dadosBancariosClienteDevolucaoSaldo,
              )}
            />
            <Field
              label="Observações financeiras"
              value={text(scope.financeiro?.observacoesFinanceiro)}
            />
          </Grid>
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

  const selectedScope = useMemo(() => scopeResponse?.draft ?? null, [scopeResponse?.draft]);

  if (loadingScope)
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RotateCw className="h-4 w-4 animate-spin" />
          Carregando visualização...
        </div>
      </Card>
    );
  if (scopeError || !selectedScope)
    return (
      <Card className="p-4">
        <p className="font-medium">Escopo não encontrado.</p>
        <Button asChild className="mt-3">
          <Link href={`/clients/${cnpj}/scopes`}>Voltar para escopos</Link>
        </Button>
      </Card>
    );

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
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button asChild variant="outline">
              <Link href={`/clients/${cnpj}/scopes`}>Voltar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clients/${cnpj}/scopes/edit/${id}`}>Editar</Link>
            </Button>
            <Button onClick={() => window.print()}>Baixar em PDF</Button>
          </div>
        </div>
      </Card>
      <ScopeDetails scope={selectedScope} versionLabel="Escopo atual" />
      <style jsx global>{`
        @media print {
          header,
          nav,
          .print\:hidden {
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
