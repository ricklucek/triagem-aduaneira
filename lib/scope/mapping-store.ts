"use client";

export type MappingTemplate = {
  id: string;
  cnpj: string; // chave
  docType: "DOCX" | "PDF" | "XLSX" | "UNKNOWN";
  mapping: Record<string, string>; // extractedKey -> targetPath
  updatedAt: string;
};

type StoreShape = {
  templates: MappingTemplate[];
};

const STORAGE_KEY = "scopedesk:mvp:mappingTemplates:v1";

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "tpl") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function readStore(): StoreShape {
  if (typeof window === "undefined") return { templates: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { templates: [] };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!Array.isArray(parsed?.templates)) return { templates: [] };
    return parsed;
  } catch {
    return { templates: [] };
  }
}

function writeStore(next: StoreShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function inferDocType(filename: string): MappingTemplate["docType"] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".docx")) return "DOCX";
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".xlsx")) return "XLSX";
  return "UNKNOWN";
}

export function loadTemplate(
  cnpj: string,
  docType: MappingTemplate["docType"],
): MappingTemplate | null {
  const store = readStore();
  // pega o mais recente
  const list = store.templates
    .filter((t) => t.cnpj === cnpj && t.docType === docType)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return list[0] ?? null;
}

export function saveTemplate(
  cnpj: string,
  docType: MappingTemplate["docType"],
  mapping: Record<string, string>,
) {
  const store = readStore();

  const tpl: MappingTemplate = {
    id: uid("tpl"),
    cnpj,
    docType,
    mapping,
    updatedAt: nowISO(),
  };

  store.templates = [tpl, ...store.templates].slice(0, 100); // limite MVP
  writeStore(store);
  return tpl;
}

export function deleteTemplatesForClient(cnpj: string) {
  const store = readStore();
  store.templates = store.templates.filter((t) => t.cnpj !== cnpj);
  writeStore(store);
}

export function listTemplates(cnpj: string) {
  const store = readStore();
  return store.templates
    .filter((t) => t.cnpj === cnpj)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
