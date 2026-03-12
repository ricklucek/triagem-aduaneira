"use client";

import { useCallback, useState } from "react";
import type { Scope } from "@/lib/scope/schema";
import type { ScopeRecord } from "@/lib/scope/store";
import {
  listScopes,
  getScope,
  saveDraft,
  publishFromDraft,
  cloneFromPublished,
  deleteScope,
} from "@/lib/scope/store";

export function useScopeStore(cnpj: string) {
  const [version, setVersion] = useState(0);
  const records: ScopeRecord[] = listScopes(cnpj);
  const loading = false;

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  void version;

  const loadOne = useCallback((id: string) => getScope(cnpj, id), [cnpj]);

  const upsertDraft = useCallback(
    (draftId: string | null, data: Scope) => {
      const r = saveDraft(cnpj, draftId, data);
      refresh();
      return r;
    },
    [cnpj, refresh]
  );

  const publish = useCallback(
    (draftId: string, data: Scope) => {
      const r = publishFromDraft(cnpj, draftId, data);
      refresh();
      return r;
    },
    [cnpj, refresh]
  );

  const cloneLatestPublished = useCallback(
    (publishedId?: string) => {
      const r = cloneFromPublished(cnpj, publishedId);
      refresh();
      return r;
    },
    [cnpj, refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteScope(cnpj, id);
      refresh();
    },
    [cnpj, refresh]
  );

  return { loading, records, refresh, loadOne, upsertDraft, publish, cloneLatestPublished, remove };
}
