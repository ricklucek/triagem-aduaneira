import { EscopoForm } from "./types";

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
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

  check(hasValue(data.informacoesFixas.salarioMinimoVigente));

  check(hasValue(data.sobreEmpresa.razaoSocial));
  check(hasValue(data.sobreEmpresa.cnpj));
  check(hasValue(data.sobreEmpresa.inscricaoEstadual));
  check(hasValue(data.sobreEmpresa.enderecoCompletoEscritorio));
  check(hasValue(data.sobreEmpresa.cnaePrincipal));
  check(hasValue(data.sobreEmpresa.regimeTributacao));
  check(hasValue(data.sobreEmpresa.responsavelComercial));

  check(data.contatos.length > 0);

  check(data.operacao.tipos.length > 0);

  if (data.operacao.tipos.includes("IMPORTACAO")) {
    const i = data.operacao.importacao;
    check(!!i);
    if (i) {
      check(i.ncms.length > 0 && i.ncms.every((x) => hasValue(x.codigo)));
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

    const ncmsList: Array<{ codigo?: string } | string> = e?.ncms ?? [];

    check(!!e);
    if (e) {
      check(hasValue(e.analistaDA));
      check(hasValue(e.analistaAE));
      check(hasValue(e.produtosExportados));
      check(ncmsList.length > 0 && ncmsList.every((x) => hasValue(typeof x === "string" ? x : x.codigo)));
      check(
        e.portosFronteiras.length > 0 ||
          hasValue(e.outroPorto) ||
          hasValue(e.outraFronteira)
      );
      check(hasValue(e.destinacao));
      check(e.destinacao !== "CONSUMO" || hasValue(e.subtipoConsumo));
    }
  }

  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.banco));
  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.agencia));
  check(hasValue(data.financeiro.dadosBancariosClienteDevolucaoSaldo.conta));

  return total === 0 ? 0 : Math.round((done / total) * 100);
}