export type PrepostoContact = {
  id: string;
  preposto_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  principal: boolean;
};

export type PrepostoTariff = {
  id: string;
  localidade_id: string;
  codigo: string;
  operacao: "IMPORTACAO" | "EXPORTACAO";
  tipo: string;
  valor: number | null;
  valor_descricao: string | null;
  condicao: string | null;
  principal: boolean;
  moeda: string;
  ativo: boolean;
  observacoes: string | null;
};

export type PrepostoLocality = {
  id: string;
  preposto_id: string;
  cidade: string;
  uf: string | null;
  descricao_local: string | null;
  tipo_local: string | null;
  atende_importacao: boolean;
  atende_exportacao: boolean;
  valor_importacao: number | null;
  valor_exportacao: number | null;
  valor_importacao_descricao: string | null;
  valor_exportacao_descricao: string | null;
  moeda: string;
  observacoes: string | null;
  tarifas: PrepostoTariff[];
};

export type PrepostoCredentialReference = {
  id: string;
  nome: string;
  cpf_mascarado: string | null;
  registro_rfb: string | null;
  categoria: string;
  localidade_ids: string[];
};

export type PrepostoAdmin = {
  id: string;
  organization_id: string | null;
  nome: string;
  razao_social: string | null;
  ativo: boolean;
  observacoes: string | null;
  contatos: PrepostoContact[];
  localidades: PrepostoLocality[];
  credenciados: PrepostoCredentialReference[];
};

export type PrepostoCredential = {
  id: string;
  organization_id: string;
  nome: string;
  cpf: string;
  registro_rfb: string | null;
  categoria: string;
  ativo: boolean;
  observacoes: string | null;
};

export type PrepostoListResponse = {
  items: PrepostoAdmin[];
  total: number;
  summary: {
    prepostos: number;
    localidades: number;
    tarifas: number;
    credenciados: number;
  };
};

export type PrepostoCredentialListResponse = {
  items: PrepostoCredential[];
  total: number;
};

export type PrepostoPayload = Pick<
  PrepostoAdmin,
  "nome" | "razao_social" | "ativo" | "observacoes"
>;

export type PrepostoContactPayload = Omit<
  PrepostoContact,
  "id" | "preposto_id"
>;
export type PrepostoLocalityPayload = Omit<
  PrepostoLocality,
  "id" | "preposto_id" | "tarifas"
>;
export type PrepostoTariffPayload = Omit<
  PrepostoTariff,
  "id" | "localidade_id"
>;
export type PrepostoCredentialPayload = Omit<
  PrepostoCredential,
  "id" | "organization_id"
>;
