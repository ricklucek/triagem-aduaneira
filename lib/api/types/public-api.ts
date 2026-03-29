export interface PublicCompanyLookupResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  enderecoCompletoEscritorio?: string | null;
  enderecoCompletoArmazem?: string | null;
  cnae_fiscal?: string | null;
  cnae_fiscal_descricao?: string | null;
  cnaes_secundarios?: {
    codigo: string;
    descricao: string;
  }[];
  regimeTributacao?:
    | "SIMPLES_NACIONAL"
    | "LUCRO_PRESUMIDO"
    | "LUCRO_REAL"
    | null;
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
