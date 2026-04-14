import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  OrganizationMeResponse,
  OrganizationSettingsResponse,
  UpdateOrganizationSettingsPayload,
} from "@/lib/api/types/organization-api";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";

export const organizationSettingsApi = {
  async getOrganizationMe(): Promise<OrganizationMeResponse> {
    const { data } = await http.get<OrganizationMeResponse>(
      API_ROUTES.organizations.me,
    );
    return data;
  },

  async getSettings(): Promise<OrganizationSettingsResponse> {
    const { data } = await http.get<OrganizationSettingsResponse>(
      API_ROUTES.organizations.settings,
    );
    return data;
  },

  async updateSettings(
    payload: UpdateOrganizationSettingsPayload,
  ): Promise<OrganizationSettingsResponse> {
    const { data } = await http.put<OrganizationSettingsResponse>(
      API_ROUTES.organizations.settings,
      payload,
    );
    return data;
  },

  async getScopeMetadata(): Promise<ScopeMetadataResponse> {
    const { data } = await http.get<ScopeMetadataResponse>(
      API_ROUTES.scopes.metadata,
    );
    return data;
  },
};
