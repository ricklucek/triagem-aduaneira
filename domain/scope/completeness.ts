import { EscopoForm } from "./types";

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function calculateCompleteness(data: EscopoForm): number {
  let total = 0;
  let done = 0;

  function check(condition: boolean) {
    total += 1;
    if (condition) done += 1;
  }

  // Informações fixas
  check(hasValue(data.informacoesFixas.salarioMinimoVigente));
  check(hasValue(data.informacoesFixas.dadosBancariosCasco.banco));
  check(hasValue(data.informacoesFixas.dadosBancariosCasco.agencia));
  check(hasValue(data.informacoesFixas.dadosBancariosCasco.conta));

  // Empresa
  check(hasValue(data.sobreEmpresa.razaoSocial));
  check(hasValue(data.sobreEmpresa.cnpj));
  check(hasValue(data.sobreEmpresa.inscricaoEstadual));
  check(hasValue(data.sobreEmpresa.enderecoCompletoEscritorio));
  check(hasValue(data.sobreEmpresa.enderecoCompletoArmazem));
  check(hasValue(data.sobreEmpresa.cnaePrincipal));
  check(hasValue(data.sobreEmpresa.regimeTributacao));
  check(hasValue(data.sobreEmpresa.responsavelComercial));

  // Contatos
  check(data.contatos.length > 0);
  for (const c of data.contatos) {
    check(hasValue(c.nome));
    check(hasValue(c.cargoDepartamento));
    check(hasValue(c.email));
    check(hasValue(c.telefone));
  }

  // Operação
  check(data.operacao.tipos.length > 0);

  if (data.operacao.tipos.includes("IMPORTACAO")) {
    const i = data.operacao.importacao;
    check(!!i);
    if (i) {
      check(hasValue(i.analistaDA));
      check(hasValue(i.analistaAE));
      check(hasValue(i.produtosImportados));
      check(i.ncms.length > 0 && i.ncms.every((x) => hasValue(x)));
      check(hasValue(i.vinculoComExportador));
      check(i.locaisEntrada.length > 0 || hasValue(i.outroLocalEntrada));
      check(i.armazensLiberacao.length > 0 || hasValue(i.outroArmazemLiberacao));
      check(hasValue(i.necessidadeDtcDta));
      check(hasValue(i.necessidadeLiLpco));
      check(i.necessidadeLiLpco === "NAO" || i.anuencias.length > 0);
      check(hasValue(i.destinacao));
      check(i.destinacao !== "CONSUMO" || hasValue(i.subtipoConsumo));
    }
  }

  if (data.operacao.tipos.includes("EXPORTACAO")) {
    const e = data.operacao.exportacao;
    check(!!e);
    if (e) {
      check(hasValue(e.analistaDA));
      check(hasValue(e.analistaAE));
      check(hasValue(e.produtosExportados));
      check(e.ncms.length > 0 && e.ncms.every((x) => hasValue(x)));
      check(
        e.portosFronteiras.length > 0 ||
          hasValue(e.outroPorto) ||
          hasValue(e.outraFronteira)
      );
      check(hasValue(e.destinacao));
      check(e.destinacao !== "CONSUMO" || hasValue(e.subtipoConsumo));
    }
  }

  // Financeiro
  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.banco));
  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.agencia));
  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.conta));
  check(hasValue(data.financeiro.observacoesFinanceiro));

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}