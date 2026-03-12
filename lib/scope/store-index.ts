"use client";

import type { ScopeRecord } from "@/lib/scope/store";

const STORAGE_KEY = "scopedesk:mvp:v1";

type StoreShape = {
  byCnpj: Record<string, ScopeRecord[]>;
};

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

export type DashboardRow = {
  cnpj: string;
  id: string;
  status: "draft" | "published";
  version: number;
  title?: string;
  updatedAt: string;
  data: unknown; // Scope (evita circular import no MVP)
};

export function listAllScopeRecords(): DashboardRow[] {
  const store = readStore();
  const rows: DashboardRow[] = [];

  for (const [cnpj, list] of Object.entries(store.byCnpj ?? {})) {
    for (const r of list ?? []) {
      rows.push({
        cnpj,
        id: r.id,
        status: r.status,
        version: r.version,
        title: r.title,
        updatedAt: r.updatedAt,
        data: r.data,
      });
    }
  }

  // mais recentes primeiro
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return rows;
}

export function listActiveClients(): { cnpj: string; title?: string; updatedAt: string }[] {
  const rows = listAllScopeRecords();
  const map = new Map<string, { cnpj: string; title?: string; updatedAt: string }>();

  for (const r of rows) {
    const prev = map.get(r.cnpj);
    if (!prev || r.updatedAt > prev.updatedAt) {
      map.set(r.cnpj, { cnpj: r.cnpj, title: r.title, updatedAt: r.updatedAt });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}