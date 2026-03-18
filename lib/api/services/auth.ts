import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type { AuthUser, LoginPayload, LoginResponse, RefreshResponse } from "@/lib/api/types/auth-api";

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>(API_ROUTES.auth.login, payload);
    return data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await http.post<RefreshResponse>(API_ROUTES.auth.refresh, { refreshToken });
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await http.get<AuthUser>(API_ROUTES.auth.me);
    return data;
  },

  async logout(): Promise<void> {
    await http.post(API_ROUTES.auth.logout, {});
  },
};
