import { EscopoForm } from "./types";

export const escopoFormDefault: EscopoForm = {
  sobreEmpresa: {
    razaoSocial: "",
    nomeResumido: "",
    cnpj: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    enderecoCompletoEscritorio: "",
    enderecoCompletoArmazem: "",
    cnaePrincipal: "",
    cnaeSecundario: "",
    regimeTributacao: "SIMPLES_NACIONAL",
    responsavelComercial: "",
  },

  contatos: [
    {
      nome: "",
      cargoDepartamento: "",
      email: "",
      telefone: "",
    },
  ],

  operacao: {
    tipos: [],
  },

  servicos: {},

  financeiro: {
    dadosBancariosClienteDevolucaoSaldo: {
      banco: "",
      agencia: "",
      conta: "",
    },
    observacoesFinanceiro: "",
  },
};
