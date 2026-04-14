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

export interface ScopeSummaryApi {
  id: string;
  status: ScopeStatus;
  completeness_score: number;
  version?: number | null;
  updated_at?: string | null;
  last_published_at?: string | null;
  client_id?: string | null;
  client_cnpj?: string | null;
  client_razao_social?: string | null;
  responsible_user_id?: string | null;
  responsible_user_nome?: string | null;
}

export interface BulkReassignResponsiblePayload {
  old_user_id: string;
  new_user_id: string;
  apply_status?: ScopeStatus[];
  only_active_assignments?: boolean;
  dry_run?: boolean;
}

export interface BulkReassignResponsibleResponse {
  dry_run: boolean;
  affected_scopes: number;
  scope_ids: string[];
}

export interface ScopeApiClient {
  createScope(initial?: Partial<EscopoForm>): Promise<CreateScopeResponse>;
  listScopes(params: ListScopesParams): Promise<ListScopesResult>;
  getScope(id: string): Promise<ScopeDetailResponse>;
  saveScope(payload: SaveScopeDraftPayload): Promise<void>;
  publishScope(id: string): Promise<PublishResult>;
  deleteScope(id: string): Promise<void>;
  listScopeVersions(id: string): Promise<ScopeVersionsResponse>;
  getMetadata(): Promise<ScopeMetadataResponse>;
  bulkReassignResponsible(
    payload: BulkReassignResponsiblePayload,
  ): Promise<BulkReassignResponsibleResponse>;
}
