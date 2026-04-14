"use client";

import useSWR from "swr";
import { clientsApi } from "@/lib/api/services/clients";
import type {
  ListClientScopesParams,
  ListClientsParams,
} from "@/lib/api/types/client-api";

export function useClients(params: ListClientsParams | null) {
  const key = params ? `clients:${JSON.stringify(params)}` : null;
  return useSWR(key, async () => {
    if (!params) throw new Error("Parâmetros inválidos para listagem de clientes.");
    return clientsApi.listClients(params);
  });
}

export function useClient(clientId: string | null) {
  const key = clientId ? `client:${clientId}` : null;
  return useSWR(key, async () => {
    if (!clientId) throw new Error("Client id inválido.");
    return clientsApi.getClient(clientId);
  });
}

export function useClientScopes(
  clientId: string | null,
  params: ListClientScopesParams | null,
) {
  const key = clientId && params
    ? `client-scopes:${clientId}:${JSON.stringify(params)}`
    : null;

  return useSWR(key, async () => {
    if (!clientId || !params)
      throw new Error("Parâmetros inválidos para listagem de escopos por cliente.");
    return clientsApi.listClientScopes(clientId, params);
  });
}
