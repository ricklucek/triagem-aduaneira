import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type { CreateUserPayload, UserSummary } from "@/lib/api/types/dashboard-api";

export const usersApi = {
  async listUsers(): Promise<UserSummary[]> {
    const { data } = await http.get<UserSummary[]>(API_ROUTES.users.list);
    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<UserSummary> {
    const { data } = await http.post<UserSummary>(API_ROUTES.users.create, payload);
    return data;
  },
};
