export interface PublicCompanyLookupResponse {
  cnpj: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  razao_social: string;
  nome_fantasia?: string | null;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  cnae_fiscal?: string | null;
  cnae_fiscal_descricao?: string | null;
  cnaes_secundarios?: {
    codigo: string;
    descricao: string;
  }[];
  regimeTributacao?:
    "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL" | null;
}

export interface PrepostoLookupItem {
  id: string;
  localidadeId?: string;
  cidade: string;
  contatoNome: string | null;
  descricaoLocal: string | null;
  email: string | null;
  moeda: string | null;
  nome: string;
  observacoes: string | null;
  operacao: "IMPORTACAO" | "EXPORTACAO";
  telefone: string | null;
  uf: string | null;
  valor: number | string | null;
  valorDescricao: string | null;
  tarifas?: PrepostoTarifaLookup[];
  credenciados?: PrepostoCredenciadoLookup[];
}

export interface PrepostoTarifaLookup {
  id: string;
  codigo: string | null;
  tipo: string;
  operacao: "IMPORTACAO" | "EXPORTACAO" | "AMBAS";
  valor: number | null;
  valorDescricao: string | null;
  condicao: string;
  principal: boolean;
  moeda: string;
  observacoes: string | null;
}

export interface PrepostoCredenciadoLookup {
  id: string;
  nome: string;
  cpfMascarado: string | null;
  registroRfb: string | null;
  categoria: string | null;
}

export interface PrepostoLookupResponse {
  items: PrepostoLookupItem[];
  total: number;
}
