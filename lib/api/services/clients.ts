import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type { ScopeSummary } from "@/data/scope/ScopeRepo";
import type {
  ClientApi,
  ListClientScopesParams,
  ListClientScopesResponse,
  ListClientsParams,
  ListClientsResponse,
  UpdateClientPayload,
} from "@/lib/api/types/client-api";
import type { ScopeSummaryApi } from "@/lib/api/types/scope-api";

type ClientsListResponseApi =
  | ListClientsResponse
  | {
      items: ClientApi[];
      total?: number;
      limit?: number;
      offset?: number;
    }
  | ClientApi[];

type ClientScopesResponseApi =
  | ListClientScopesResponse
  | {
      items: ScopeSummaryApi[];
      total?: number;
      limit?: number;
      offset?: number;
    }
  | ScopeSummaryApi[];

function normalizeScopeSummary(item: ScopeSummaryApi): ScopeSummary {
  return {
    id: item.id,
    status: item.status,
    completeness_score: item.completeness_score ?? 0,
    client_id: item.client_id ?? null,
    client_cnpj: item.client_cnpj ?? null,
    razao_social: item.client_razao_social ?? null,
    updated_at: item.updated_at ?? null,
    last_published_at: item.last_published_at ?? null,
    version: item.version ?? null,
    version_count: null,
    responsible_user_id: item.responsible_user_id ?? null,
    responsible_user_nome: item.responsible_user_nome ?? null,
  };
}

function normalizeClientsList(
  response: ClientsListResponseApi,
  params: ListClientsParams,
): ListClientsResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      total: response.length,
      limit: params.limit ?? response.length,
      offset: params.offset ?? 0,
    };
  }

  const items = response.items ?? [];
  return {
    items,
    total: response.total ?? items.length,
    limit: response.limit ?? params.limit ?? items.length,
    offset: response.offset ?? params.offset ?? 0,
  };
}

function normalizeClientScopesList(
  response: ClientScopesResponseApi,
  params: ListClientScopesParams,
): ListClientScopesResponse {
  if (Array.isArray(response)) {
    return {
      items: response.map(normalizeScopeSummary),
      total: response.length,
      limit: params.limit ?? response.length,
      offset: params.offset ?? 0,
    };
  }

  const items = (response.items ?? []).map(normalizeScopeSummary);
  return {
    items,
    total: response.total ?? items.length,
    limit: response.limit ?? params.limit ?? items.length,
    offset: response.offset ?? params.offset ?? 0,
  };
}

export const clientsApi = {
  async listClients(params: any): Promise<ListClientsResponse> {
    const { data } = await http.get<ClientsListResponseApi>(API_ROUTES.clients.list, {
      params,
    });

    return normalizeClientsList(data, params);
  },

  async getClient(clientId: string): Promise<ClientApi> {
    const { data } = await http.get<ClientApi>(
      API_ROUTES.clients.detail(clientId),
    );
    return data;
  },

  async updateClient(
    clientId: string,
    payload: UpdateClientPayload,
  ): Promise<ClientApi> {
    const { data } = await http.patch<ClientApi>(
      API_ROUTES.clients.update(clientId),
      payload,
    );
    return data;
  },

  async listClientScopes(
    clientId: string,
    params: any,
  ): Promise<ListClientScopesResponse> {
    const { data } = await http.get<ClientScopesResponseApi>(
      API_ROUTES.clients.scopes(clientId),
      {
        params,
      },
    );

    return normalizeClientScopesList(data, params);
  },
};
