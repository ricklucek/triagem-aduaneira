export interface PublicCompanyLookupResponse {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  enderecoCompletoEscritorio?: string | null;
  enderecoCompletoArmazem?: string | null;
  cnaePrincipal?: string | null;
  cnaesSecundarios?: string[];
  regimeTributacao?: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL" | null;
}

export interface PrepostoLookupItem {
  id: string;
  nome: string;
  telefone: string;
  valor: number | null;
  cidade: string;
  operacao: "IMPORTACAO" | "EXPORTACAO";
}

export interface PrepostoLookupResponse {
  cidadeConsultada: string;
  operacao: "IMPORTACAO" | "EXPORTACAO";
  resultados: PrepostoLookupItem[];
}
