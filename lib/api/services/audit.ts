import { http } from "@/lib/api/config/http";
import { API_ROUTES } from "@/lib/api/config/routes";
import type {
  AuditEvent,
  AuditEventFilters,
  AuditEventListResponse,
  AuditEventOptions,
  AuditReversalPreview,
  AuditReversalResult,
} from "@/lib/api/types/audit-api";

export const auditApi = {
  async listEvents(filters: AuditEventFilters): Promise<AuditEventListResponse> {
    const { data } = await http.get<AuditEventListResponse>(
      API_ROUTES.audit.events,
      { params: { ...filters } },
    );
    return data;
  },

  async getOptions(): Promise<AuditEventOptions> {
    const { data } = await http.get<AuditEventOptions>(API_ROUTES.audit.options);
    return data;
  },

  async getEvent(eventId: string): Promise<AuditEvent> {
    const { data } = await http.get<AuditEvent>(API_ROUTES.audit.event(eventId));
    return data;
  },

  async previewReversal(eventId: string): Promise<AuditReversalPreview> {
    const { data } = await http.post<AuditReversalPreview>(
      API_ROUTES.audit.reversalPreview(eventId),
    );
    return data;
  },

  async reverseEvent(eventId: string): Promise<AuditReversalResult> {
    const { data } = await http.post<AuditReversalResult>(
      API_ROUTES.audit.reverse(eventId),
      { confirmation: "REVERTER" },
    );
    return data;
  },
};
