import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  ClientDetailResponse,
  ListClientScopesParams,
  ListClientScopesResponse,
  ListClientsParams,
  ListClientsResponse,
  UpdateClientPayload,
} from "@/lib/api/types/client-api";

export const clientsApi = {
  async listClients(params: ListClientsParams = {}): Promise<ListClientsResponse> {
    const { data } = await http.get<ListClientsResponse>(API_ROUTES.clients.list, {
      params,
    });
    return data;
  },

  async getClient(clientId: string): Promise<ClientDetailResponse> {
    const { data } = await http.get<ClientDetailResponse>(
      API_ROUTES.clients.detail(clientId),
    );
    return data;
  },

  async updateClient(
    clientId: string,
    payload: UpdateClientPayload,
  ): Promise<ClientDetailResponse> {
    const { data } = await http.patch<ClientDetailResponse>(
      API_ROUTES.clients.update(clientId),
      payload,
    );
    return data;
  },

  async listClientScopes(
    clientId: string,
    params: ListClientScopesParams = {},
  ): Promise<ListClientScopesResponse> {
    const { data } = await http.get<ListClientScopesResponse>(
      API_ROUTES.clients.scopes(clientId),
      {
        params,
      },
    );
    return data;
  },
};
