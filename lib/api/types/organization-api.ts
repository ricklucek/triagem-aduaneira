import type { AdminSettingsResponse } from "@/lib/api/types/scope-metadata";

export interface OrganizationMeResponse {
  id: string;
  nome: string;
  fixedInfo: AdminSettingsResponse;
}

export type OrganizationSettingsResponse = AdminSettingsResponse;

export type UpdateOrganizationSettingsPayload = AdminSettingsResponse;
