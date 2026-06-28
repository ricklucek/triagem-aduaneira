import type {
  ListScopesParams,
  ListScopesResult,
  PublishResult,
  ScopeVersion,
} from "@/data/scope/ScopeRepo";
import type { DeepPartial, EscopoForm } from "@/domain/scope/types";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";

export type ScopeStatus = "draft" | "published" | "archived";
export interface ScopeDetailResponse {
  id: string;
  draft: EscopoForm;
  created_by: {
    id: string;
    nome: string;
    email: string;
  };
  status: ScopeStatus;
}

export interface CreateScopeResponse {
  id: string;
}

export interface ScopeTemplateSummary {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface ScopeTemplateDetailResponse extends ScopeTemplateSummary {
  draft: DeepPartial<EscopoForm>;
}

export interface CreateScopeTemplatePayload {
  name: string;
  description?: string;
  draft: DeepPartial<EscopoForm>;
}

export interface UpdateScopeTemplatePayload extends CreateScopeTemplatePayload {
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

export interface BulkReassignResponsiblePayload {
  old_user_id: string;
  new_user_id: string;
  apply_status?: ScopeStatus[];
  only_active_assignments?: boolean;
  dry_run?: boolean;
}

export type BulkAssignmentGroupBy =
  | "responsavel_comercial"
  | "analista_da"
  | "analista_ae";

export interface BulkAssignmentSummaryItem {
  userId: string;
  userName: string;
  userRole: string;
  userSetor: string;
  totalScopes: number;
}

export interface BulkAssignmentSummaryResponse {
  groupBy: BulkAssignmentGroupBy;
  totalUsers: number;
  totalScopes: number;
  items: BulkAssignmentSummaryItem[];
}

export interface BulkAssignmentScopeItem {
  id: string;
  status: ScopeStatus;
  clientName: string;
  clientCnpj: string;
  updatedAt: string;
}

export interface BulkAssignmentScopesResponse {
  groupBy: BulkAssignmentGroupBy;
  userId: string;
  total: number;
  items: BulkAssignmentScopeItem[];
}

export interface BulkAssignmentUpdatePayload {
  groupBy: BulkAssignmentGroupBy;
  fromUserId: string;
  toUserId: string;
  scopeIds: string[];
}

export interface BulkAssignmentUpdateResponse {
  ok: boolean;
  impactedScopes: number;
  updatedScopeIds: string[];
}

export interface ScopeApiClient {
  createScope(initial?: DeepPartial<EscopoForm>, templateId?: string | number): Promise<CreateScopeResponse>;
  listScopeTemplates(): Promise<ScopeTemplateSummary[]>;
  getScopeTemplate(templateId: string): Promise<ScopeTemplateDetailResponse>;
  createScopeTemplate(payload?: CreateScopeTemplatePayload): Promise<ScopeTemplateDetailResponse>;
  updateScopeTemplate(payload: UpdateScopeTemplatePayload): Promise<ScopeTemplateDetailResponse>;
  deleteScopeTemplate(templateId: string): Promise<void>;
  listScopes(params: ListScopesParams): Promise<ListScopesResult>;
  countUserAssignments(): Promise<{ type: string; count: number }[]>;
  getScope(id: string): Promise<ScopeDetailResponse>;
  saveScope(payload: SaveScopeDraftPayload): Promise<void>;
  publishScope(id: string): Promise<PublishResult>;
  deleteScope(id: string): Promise<void>;
  listScopeVersions(id: string): Promise<ScopeVersionsResponse>;
  getMetadata(): Promise<ScopeMetadataResponse>;
  bulkReassignResponsible(
    payload: BulkReassignResponsiblePayload,
  ): Promise<BulkReassignResponsibleResponse>;
  getBulkAssignmentSummary(
    groupBy: BulkAssignmentGroupBy,
  ): Promise<BulkAssignmentSummaryResponse>;
  getBulkAssignmentScopes(
    groupBy: BulkAssignmentGroupBy,
    userId: string,
  ): Promise<BulkAssignmentScopesResponse>;
  updateBulkAssignment(
    payload: BulkAssignmentUpdatePayload,
  ): Promise<BulkAssignmentUpdateResponse>;
}
