"use client";

import useSWR from "swr";
import type { ListScopesParams } from "@/data/scope/ScopeRepo";
import { scopeApi } from "@/lib/api/services/scopes";
import { organizationSettingsApi } from "@/lib/api/services/organization-settings";

export function useScopes(params: ListScopesParams | null) {
  const key = params ? `scopes:${JSON.stringify(params)}` : null;
  return useSWR(key, async () => {
    if (!params) throw new Error("Parâmetros inválidos para listagem.");
    return scopeApi.listScopes(params);
  });
}

export function useScope(scopeId: string | null) {
  const key = scopeId ? `scope:${scopeId}` : null;
  return useSWR(key, async () => {
    if (!scopeId) throw new Error("Scope id inválido.");
    return scopeApi.getScope(scopeId);
  });
}

export function useScopeVersions(scopeId: string | null) {
  const key = scopeId ? `scope-versions:${scopeId}` : null;
  return useSWR(key, async () => {
    if (!scopeId) throw new Error("Scope id inválido para versões.");
    return scopeApi.listScopeVersions(scopeId);
  });
}

export function useScopeMetadata() {
  return useSWR("scope:metadata", organizationSettingsApi.getScopeMetadata);
}
