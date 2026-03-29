import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserSummary,
} from "@/lib/api/types/dashboard-api";

export const usersApi = {
  async listUsers(): Promise<UserSummary[]> {
    const { data } = await http.get<UserSummary[]>(API_ROUTES.users.list);
    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<UserSummary> {
    const { data } = await http.post<UserSummary>(
      API_ROUTES.users.create,
      payload,
    );
    return data;
  },

  async updateUser(userId: string, payload: UpdateUserPayload): Promise<UserSummary> {
    const { data } = await http.put<UserSummary>(API_ROUTES.users.update(userId), payload);
    return data;
  },

  async deleteUser(userId: string): Promise<void> {
    await http.delete(API_ROUTES.users.delete(userId));
  },

};
