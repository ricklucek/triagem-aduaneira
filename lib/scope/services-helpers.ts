import type { Scope } from "@/lib/scope/schema";

export function findService(scope: Scope, operationScope: "IMPORTACAO" | "EXPORTACAO", code: string) {
  return scope.services.find((s) => s.operationScope === operationScope && s.code === code) ?? null;
}

export function upsertService(scope: Scope, partial: Scope["services"][number]) {
  const idx = scope.services.findIndex(
    (s) => s.operationScope === partial.operationScope && s.code === partial.code
  );

  if (idx === -1) return [...scope.services, partial];

  const next = [...scope.services];
  next[idx] = { ...next[idx], ...partial, extra: { ...(next[idx].extra ?? {}), ...(partial.extra ?? {}) } };
  return next;
}

export function removeService(scope: Scope, operationScope: "IMPORTACAO" | "EXPORTACAO", code: string) {
  return scope.services.filter((s) => !(s.operationScope === operationScope && s.code === code));
}