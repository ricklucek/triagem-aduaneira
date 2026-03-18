import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type { AdminSettingsResponse, ScopeMetadataResponse, UpdateAdminSettingsPayload } from "@/lib/api/types/scope-metadata";

export const adminSettingsApi = {
  async getSettings(): Promise<AdminSettingsResponse> {
    const { data } = await http.get<AdminSettingsResponse>(API_ROUTES.admin.settings);
    return data;
  },

  async updateSettings(payload: UpdateAdminSettingsPayload): Promise<AdminSettingsResponse> {
    const { data } = await http.put<AdminSettingsResponse>(API_ROUTES.admin.settings, payload);
    return data;
  },

  async getScopeMetadata(): Promise<ScopeMetadataResponse> {
    const { data } = await http.get<ScopeMetadataResponse>(API_ROUTES.scopes.metadata);
    return data;
  },
};
