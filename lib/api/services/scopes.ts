import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  ListScopesParams,
  ListScopesResult,
  PublishResult,
  ScopeSummary,
} from "@/data/scope/ScopeRepo";
import type { EscopoForm } from "@/domain/scope/types";
import type {
  BulkReassignResponsiblePayload,
  BulkReassignResponsibleResponse,
  CreateScopeResponse,
  SaveScopeDraftPayload,
  ScopeApiClient,
  ScopeDetailResponse,
  ScopeSummaryApi,
  ScopeVersionsResponse,
} from "@/lib/api/types/scope-api";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";

type ScopeListResponseApi =
  | ListScopesResult
  | {
      items: ScopeSummaryApi[];
      total?: number;
      limit?: number;
      offset?: number;
    }
  | ScopeSummaryApi[];

function normalizeScopeSummary(item: ScopeSummaryApi | ScopeSummary): ScopeSummary {
  return {
    id: item.id,
    status: item.status,
    completeness_score: item.completeness_score ?? 0,
    client_id: "client_id" in item ? item.client_id ?? null : null,
    client_cnpj: "client_cnpj" in item ? item.client_cnpj ?? null : null,
    razao_social:
      "client_razao_social" in item
        ? item.client_razao_social ?? null
        : (item as ScopeSummary).razao_social ?? null,
    updated_at: item.updated_at ?? null,
    last_published_at: item.last_published_at ?? null,
    version: item.version ?? null,
    version_count: "version_count" in item ? item.version_count ?? null : null,
    responsible_user_id: item.responsible_user_id ?? null,
    responsible_user_nome: item.responsible_user_nome ?? null,
  };
}

function normalizeScopeListResponse(
  response: ScopeListResponseApi,
  params: ListScopesParams,
): ListScopesResult {
  if (Array.isArray(response)) {
    return {
      items: response.map(normalizeScopeSummary),
      total: response.length,
      limit: params.limit,
      offset: params.offset,
    };
  }

  const items = (response.items ?? []).map(normalizeScopeSummary);

  return {
    items,
    total: response.total ?? items.length,
    limit: response.limit ?? params.limit,
    offset: response.offset ?? params.offset,
  };
}

export const scopeApi: ScopeApiClient = {
  async createScope(
    initial?: Partial<EscopoForm>,
  ): Promise<CreateScopeResponse> {
    const { data } = await http.post<CreateScopeResponse>(
      API_ROUTES.scopes.create,
      initial ?? {},
    );
    return data;
  },

  async listScopes(params: ListScopesParams): Promise<ListScopesResult> {
    const { data } = await http.get<ScopeListResponseApi>(API_ROUTES.scopes.list, {
      params,
    });

    return normalizeScopeListResponse(data, params);
  },

  async getScope(id: string): Promise<ScopeDetailResponse> {
    const { data } = await http.get<ScopeDetailResponse>(
      API_ROUTES.scopes.detail(id),
    );
    return data;
  },

  async saveScope(payload: SaveScopeDraftPayload): Promise<void> {
    await http.put<void>(
      API_ROUTES.scopes.saveScope(payload.id),
      payload.draft,
    );
  },

  async publishScope(id: string): Promise<PublishResult> {
    const { data } = await http.post<PublishResult>(
      API_ROUTES.scopes.publish(id),
      {},
    );
    return data;
  },

  async deleteScope(id: string): Promise<void> {
    await http.delete<void>(API_ROUTES.scopes.delete(id));
  },

  async listScopeVersions(id: string): Promise<ScopeVersionsResponse> {
    const { data } = await http.get<ScopeVersionsResponse>(
      API_ROUTES.scopes.versions(id),
    );
    return data;
  },

  async getMetadata(): Promise<ScopeMetadataResponse> {
    const { data } = await http.get<ScopeMetadataResponse>(
      API_ROUTES.scopes.metadata,
    );
    return data;
  },

  async bulkReassignResponsible(
    payload: BulkReassignResponsiblePayload,
  ): Promise<BulkReassignResponsibleResponse> {
    const { data } = await http.post<BulkReassignResponsibleResponse>(
      API_ROUTES.scopes.bulkReassignResponsible,
      payload,
    );
    return data;
  },
};
