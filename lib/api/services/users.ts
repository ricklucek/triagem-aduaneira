import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  CreateUserPayload,
  CreateUserTagPayload,
  ListUsersParams,
  UpdateUserPayload,
  UpdateUserTagPayload,
  UserSummary,
  UserTag,
} from "@/lib/api/types/dashboard-api";

export const usersApi = {
  async listUsers(params: ListUsersParams = {}): Promise<UserSummary[]> {
    const { data } = await http.get<UserSummary[]>(API_ROUTES.users.listUsers, { params });
    return data;
  },

  async listAdmins(): Promise<UserSummary[]> {
    const { data } = await http.get<UserSummary[]>(API_ROUTES.users.listAdmins);
    return data;
  },

  async listResponsibles(): Promise<UserSummary[]> {
    const { data } = await http.get<UserSummary[]>(API_ROUTES.users.listResponsibles);
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
    await http.delete(API_ROUTES.users.deleteUser(userId));
  },

  async listTags(includeInactive = false): Promise<UserTag[]> {
    const { data } = await http.get<UserTag[]>(API_ROUTES.users.tags, {
      params: { include_inactive: includeInactive },
    });
    return data;
  },

  async createTag(payload: CreateUserTagPayload): Promise<UserTag> {
    const { data } = await http.post<UserTag>(API_ROUTES.users.tags, payload);
    return data;
  },

  async updateTag(tagId: string, payload: UpdateUserTagPayload): Promise<UserTag> {
    const { data } = await http.patch<UserTag>(API_ROUTES.users.tag(tagId), payload);
    return data;
  },

};
