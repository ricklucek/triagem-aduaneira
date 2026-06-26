"use client";

import useSWR from "swr";
import type { ListScopesParams } from "@/data/scope/ScopeRepo";
import { scopeApi } from "@/lib/api/services/scopes";
import { organizationSettingsApi } from "@/lib/api/services/organization-settings";
import type { BulkAssignmentGroupBy } from "@/lib/api/types/scope-api";

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

export function useCountUserAssignments() {
  const key = `user-assignments`;
  return useSWR(key, async () => {
    return scopeApi.countUserAssignments();
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

export function useBulkAssignmentSummary(groupBy: BulkAssignmentGroupBy | null) {
  const key = groupBy ? `scope:bulk-assignment:summary:${groupBy}` : null;
  return useSWR(key, () => {
    if (!groupBy) throw new Error("Filtro inválido.");
    return scopeApi.getBulkAssignmentSummary(groupBy);
  });
}

export function useBulkAssignmentScopes(
  groupBy: BulkAssignmentGroupBy | null,
  userId: string | null,
) {
  const key = groupBy && userId
    ? `scope:bulk-assignment:scopes:${groupBy}:${userId}`
    : null;

  return useSWR(key, () => {
    if (!groupBy || !userId) throw new Error("Parâmetros inválidos.");
    return scopeApi.getBulkAssignmentScopes(groupBy, userId);
  });
}

export function useScopeTemplates() {
  return useSWR("scope:templates", scopeApi.listScopeTemplates);
}

export function useScopeTemplate(templateId: string | null) {
  const key = templateId ? `scope:template:${templateId}` : null;
  return useSWR(key, async () => {
    if (!templateId) throw new Error("Template inválido.");
    return scopeApi.getScopeTemplate(templateId);
  });
}
