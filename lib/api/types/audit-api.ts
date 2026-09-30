export interface AuditActor {
  id: string | null;
  name: string;
  email: string | null;
}

export interface AuditChange {
  id: string;
  entityType: string;
  entityId: string;
  scopeId: string | null;
  subjectUserId: string | null;
  clientId: string | null;
  label: string;
  changedFields: string[];
  createdAt: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actor: AuditActor;
  module: "scopes" | "users" | string;
  action: string;
  entityType: string;
  entityId: string | null;
  operationId: string | null;
  title: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  reversesEventId: string | null;
  reversible: boolean;
  reversed: boolean;
  affectedCount: number;
  targetLabel?: string;
  createdAt: string;
  changes?: AuditChange[];
}

export interface AuditEventFilters {
  q?: string;
  module?: string;
  action?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEventListResponse {
  items: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditEventOptions {
  modules: string[];
  actions: string[];
  actors: AuditActor[];
}

export type AuditReversalStatus =
  | "eligible"
  | "conflict"
  | "already_reversed"
  | "missing"
  | "unsupported";

export interface AuditReversalPreview {
  eventId: string;
  reversible: boolean;
  eligible: number;
  conflicts: number;
  skipped: number;
  items: Array<{
    changeId: string;
    entityId: string;
    label: string;
    status: AuditReversalStatus;
    reason: string | null;
    changedFields: string[];
  }>;
}

export interface AuditReversalResult {
  ok: true;
  event: AuditEvent;
  result: {
    reverted: number;
    skipped: number;
    conflicts: number;
  };
}
