import type { ScopeSummary } from "@/data/scope/ScopeRepo";

export interface ClientSummary {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeResumido?: string | null;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientDetailResponse extends ClientSummary {
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
}

export interface ListClientsParams {
  q?: string;
  cnpj?: string;
  ativo?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListClientsResponse {
  items: ClientSummary[];
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
    ClientDetailResponse,
    | "razaoSocial"
    | "nomeResumido"
    | "cnpj"
    | "ativo"
    | "inscricaoEstadual"
    | "inscricaoMunicipal"
  >
>;
