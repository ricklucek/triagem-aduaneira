"use client";

import type { Scope } from "@/lib/scope/schema";

export type ScopeRecord = {
  id: string;                 // draftId/versionId
  cnpj: string;
  status: "draft" | "published";
  version: number;            // incrementa ao publicar
  title?: string;             // opcional (ex.: Razão Social)
  updatedAt: string;
  data: Scope;                // snapshot do formulário
};

type StoreShape = {
  byCnpj: Record<string, ScopeRecord[]>;
};

const STORAGE_KEY = "scopedesk:mvp:v1";

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function readStore(): StoreShape {
  if (typeof window === "undefined") return { byCnpj: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byCnpj: {} };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed?.byCnpj) return { byCnpj: {} };
    return parsed;
  } catch {
    return { byCnpj: {} };
  }
}

function writeStore(next: StoreShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function sortByUpdatedAtDesc(records: ScopeRecord[]) {
  return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listScopes(cnpj: string): ScopeRecord[] {
  const store = readStore();
  return sortByUpdatedAtDesc(store.byCnpj[cnpj] ?? []);
}

export function getScope(cnpj: string, id: string): ScopeRecord | null {
  const store = readStore();
  const list = store.byCnpj[cnpj] ?? [];
  return list.find((r) => r.id === id) ?? null;
}

/**
 * Salva um draft (cria se não existir).
 * Mantém status=draft.
 */
export function saveDraft(cnpj: string, draftId: string | null, data: Scope): ScopeRecord {
  const store = readStore();
  const list = store.byCnpj[cnpj] ?? [];

  const id = draftId ?? uid("draft");
  const existing = list.find((r) => r.id === id);

  const record: ScopeRecord = {
    id,
    cnpj,
    status: "draft",
    version: existing?.version ?? data.meta?.version ?? 1,
    title: data.client?.razaoSocial ?? existing?.title ?? undefined,
    updatedAt: nowISO(),
    data: {
      ...data,
      meta: {
        ...data.meta,
        status: "draft",
        updatedAt: nowISO(),
      },
    },
  };

  const nextList = existing ? list.map((r) => (r.id === id ? record : r)) : [record, ...list];
  store.byCnpj[cnpj] = nextList;
  writeStore(store);
  return record;
}

/**
 * Publica snapshot a partir de um draft (imutável).
 * Cria um novo registro published com version = (maior published + 1).
 */
export function publishFromDraft(cnpj: string, draftId: string, data: Scope): ScopeRecord {
  const store = readStore();
  const list = store.byCnpj[cnpj] ?? [];

  const published = list.filter((r) => r.status === "published");
  const nextVersion = (published.reduce((acc, r) => Math.max(acc, r.version), 0) || 0) + 1;

  const record: ScopeRecord = {
    id: uid(`pub_v${nextVersion}`),
    cnpj,
    status: "published",
    version: nextVersion,
    title: data.client?.razaoSocial ?? undefined,
    updatedAt: nowISO(),
    data: {
      ...data,
      meta: {
        ...data.meta,
        status: "published",
        version: nextVersion,
        updatedAt: nowISO(),
      },
    },
  };

  store.byCnpj[cnpj] = [record, ...list];
  writeStore(store);
  return record;
}

/**
 * Cria um novo draft clonando a published mais recente (ou uma específica).
 */
export function cloneFromPublished(cnpj: string, publishedId?: string): ScopeRecord | null {
  const store = readStore();
  const list = store.byCnpj[cnpj] ?? [];
  const pubs = sortByUpdatedAtDesc(list.filter((r) => r.status === "published"));

  const src = publishedId ? pubs.find((p) => p.id === publishedId) : pubs[0];
  if (!src) return null;

  const draft: ScopeRecord = {
    id: uid("draft"),
    cnpj,
    status: "draft",
    version: src.version, // referência informativa; publicação vai incrementar
    title: src.title,
    updatedAt: nowISO(),
    data: {
      ...src.data,
      meta: {
        ...src.data.meta,
        status: "draft",
        updatedAt: nowISO(),
      },
    },
  };

  store.byCnpj[cnpj] = [draft, ...list];
  writeStore(store);
  return draft;
}

export function deleteScope(cnpj: string, id: string) {
  const store = readStore();
  const list = store.byCnpj[cnpj] ?? [];
  store.byCnpj[cnpj] = list.filter((r) => r.id !== id);
  writeStore(store);
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}