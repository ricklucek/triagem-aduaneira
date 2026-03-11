import { EscopoForm } from "@/domain/scope/types";

export type ScopeSummary = {
  id: string;
  cnpj: string;
  razao_social: string;
  status: "draft" | "published" | "archived";
  updated_at: string;
  last_published_at?: string | null;
  version_count: number;
  completeness_score: number;
};

export type ScopeVersion = {
  version_number: number;
  published_at: string;
  data: EscopoForm;
};

export type ListScopesParams = {
  status?: "draft" | "published" | "archived";
  cnpj?: string;
  q?: string;
  limit: number;
  offset: number;
};

export type ListScopesResult = {
  items: ScopeSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type PublishResult = {
  scope_id: string;
  version_number: number;
  published_at: string;
};

export interface ScopeRepo {
  createScope(initial?: Partial<EscopoForm>): Promise<{ id: string }>;
  getScope(id: string): Promise<{ id: string; draft: EscopoForm; status: "draft" | "published" | "archived" }>;
  saveDraft(id: string, draft: EscopoForm): Promise<void>;
  listScopes(params: ListScopesParams): Promise<ListScopesResult>;
  publish(id: string): Promise<PublishResult>;
  listVersions(id: string): Promise<ScopeVersion[]>;
}