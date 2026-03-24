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
  cidade: string;
  contatoNome: string | null;
  descricaoLocal: string | null;
  email: string | null;
  moeda: string | null;
  nome: string;
  observacoes: string | null;
  operacao: "IMPORTACAO" | "EXPORTACAO" | null;
  telefone: string | null;
  uf: string | null;
  valor: string | null;
  valorDescricao: string | null;
}

export interface PrepostoLookupResponse {
  items: PrepostoLookupItem[];
  total: number;
}
