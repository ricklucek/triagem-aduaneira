import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  ListScopesParams,
  ListScopesResult,
  PublishResult,
} from "@/data/scope/ScopeRepo";
import type { EscopoForm } from "@/domain/scope/types";
import type {
  BulkReassignResponsiblePayload,
  BulkReassignResponsibleResponse,
  CreateScopeResponse,
  SaveScopeDraftPayload,
  ScopeApiClient,
  ScopeDetailResponse,
  ScopeVersionsResponse,
} from "@/lib/api/types/scope-api";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";

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
    const { data } = await http.get<ListScopesResult>(API_ROUTES.scopes.list, {
      params,
    });
    return data;
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
