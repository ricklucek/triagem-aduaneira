import type {
  ListScopesParams,
  ListScopesResult,
  PublishResult,
  ScopeVersion,
} from "@/data/scope/ScopeRepo";
import type { EscopoForm } from "@/domain/scope/types";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";

export type ScopeStatus = "draft" | "published" | "archived";

export interface ScopeDetailResponse {
  id: string;
  draft: EscopoForm;
  status: ScopeStatus;
}

export interface CreateScopeResponse {
  id: string;
}

export interface SaveScopeDraftPayload {
  id: string;
  draft: EscopoForm;
}

export type ScopeVersionsResponse = ScopeVersion[];

export interface ScopeApiClient {
  createScope(initial?: Partial<EscopoForm>): Promise<CreateScopeResponse>;
  listScopes(params: ListScopesParams): Promise<ListScopesResult>;
  getScope(id: string): Promise<ScopeDetailResponse>;
  saveScopeDraft(payload: SaveScopeDraftPayload): Promise<void>;
  publishScope(id: string): Promise<PublishResult>;
  deleteScope(id: string): Promise<void>;
  listScopeVersions(id: string): Promise<ScopeVersionsResponse>;
  getMetadata(): Promise<ScopeMetadataResponse>;
}
