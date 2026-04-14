import type { ScopeSummary } from "@/data/scope/ScopeRepo";

export interface ClientContactApi {
  id: string;
  client_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cargo_departamento?: string | null;
  principal: boolean;
  ativo: boolean;
}

export interface ClientApi {
  id: string;
  organization_id: string;
  cnpj: string;
  razao_social: string;
  nome_resumido?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  endereco_completo_escritorio?: string | null;
  endereco_completo_armazem?: string | null;
  cnae_principal?: string | null;
  cnae_secundario?: string | null;
  regime_tributacao?: string | null;
  ativo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  contatos?: ClientContactApi[];
}

export interface ListClientsParams {
  q?: string;
  cnpj?: string;
  ativo?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListClientsResponse {
  items: ClientApi[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListClientScopesParams {
  status?: ScopeSummary["status"];
  limit?: number;
  offset?: number;
}

export interface ListClientScopesResponse {
  items: ScopeSummary[];
  total: number;
  limit: number;
  offset: number;
}

export type UpdateClientPayload = Partial<
  Pick<
    ClientApi,
    | "razao_social"
    | "nome_resumido"
    | "inscricao_estadual"
    | "inscricao_municipal"
    | "endereco_completo_escritorio"
    | "endereco_completo_armazem"
    | "cnae_principal"
    | "cnae_secundario"
    | "regime_tributacao"
    | "ativo"
  >
>;
