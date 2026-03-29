import {
  ScopeRepo,
  ListScopesParams,
  ListScopesResult,
  ScopeSummary,
  PublishResult,
  ScopeVersion,
} from "./ScopeRepo";
import { EscopoForm } from "@/domain/scope/types";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { validarFormularioCompleto } from "@/domain/scope/validate";
import { calculateCompleteness } from "@/domain/scope/completeness";
import { nanoid } from "nanoid";

type Stored = {
  id: string;
  status: "draft" | "published" | "archived";
  draft: EscopoForm;
  versions: ScopeVersion[];
  updated_at: string;
};

const KEY = "triagem.escopos.v4";

function loadAll(): Record<string, Stored> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAll(data: Record<string, Stored>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export class ScopeRepoLocal implements ScopeRepo {
  async createScope(initial?: Partial<EscopoForm>) {
    const id = nanoid();
    const now = new Date().toISOString();

    const draft: EscopoForm = {
      ...structuredClone(escopoFormDefault),
      ...initial,
      informacoesFixas: {
        ...escopoFormDefault.informacoesFixas,
        ...(initial?.informacoesFixas ?? {}),
      },
      sobreEmpresa: {
        ...escopoFormDefault.sobreEmpresa,
        ...(initial?.sobreEmpresa ?? {}),
      },
      contatos:
        initial?.contatos ?? structuredClone(escopoFormDefault.contatos),
      operacao: {
        ...escopoFormDefault.operacao,
        ...(initial?.operacao ?? {}),
      },
      servicos: {
        ...escopoFormDefault.servicos,
        ...(initial?.servicos ?? {}),
      },
      financeiro: {
        ...escopoFormDefault.financeiro,
        ...(initial?.financeiro ?? {}),
      },
    };

    const all = loadAll();
    all[id] = {
      id,
      status: "draft",
      draft,
      versions: [],
      updated_at: now,
    };
    saveAll(all);

    return { id };
  }

  async getScope(id: string) {
    const all = loadAll();
    const rec = all[id];
    if (!rec) throw new Error("Escopo não encontrado");
    return { id: rec.id, draft: rec.draft, status: rec.status };
  }

  async saveDraft(id: string, draft: EscopoForm) {
    const all = loadAll();
    const rec = all[id];
    if (!rec) throw new Error("Escopo não encontrado");
    all[id] = {
      ...rec,
      draft,
      updated_at: new Date().toISOString(),
      status: rec.status === "archived" ? "archived" : "draft",
    };
    saveAll(all);
  }

  async listScopes(params: ListScopesParams): Promise<ListScopesResult> {
    const all = Object.values(loadAll());
    const q = params.q?.toLowerCase().trim();
    const cnpj = params.cnpj?.replace(/\D/g, "");

    let filtered = all;

    if (params.status)
      filtered = filtered.filter((x) => x.status === params.status);
    if (cnpj) {
      filtered = filtered.filter(
        (x) => (x.draft.sobreEmpresa.cnpj ?? "").replace(/\D/g, "") === cnpj,
      );
    }
    if (q) {
      filtered = filtered.filter((x) => {
        const razao = (x.draft.sobreEmpresa.razaoSocial ?? "").toLowerCase();
        const doc = x.draft.sobreEmpresa.cnpj ?? "";
        return razao.includes(q) || doc.includes(q);
      });
    }

    filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    const total = filtered.length;
    const itemsSlice = filtered.slice(
      params.offset,
      params.offset + params.limit,
    );

    const items: ScopeSummary[] = itemsSlice.map((x) => ({
      id: x.id,
      cnpj: x.draft.sobreEmpresa.cnpj ?? "",
      razao_social: x.draft.sobreEmpresa.razaoSocial ?? "",
      status: x.status,
      updated_at: x.updated_at,
      last_published_at: x.versions.length
        ? x.versions[x.versions.length - 1].published_at
        : null,
      version_count: x.versions.length,
      completeness_score: calculateCompleteness(x.draft),
    }));

    return {
      items,
      total,
      limit: params.limit,
      offset: params.offset,
    };
  }

  async publish(id: string): Promise<PublishResult> {
    const all = loadAll();
    const rec = all[id];
    if (!rec) throw new Error("Escopo não encontrado");

    const result = validarFormularioCompleto(rec.draft);
    if (!result.ok) {
      throw new Error("Não é possível publicar: formulário inválido.");
    }

    const version_number = rec.versions.length + 1;
    const published_at = new Date().toISOString();

    rec.versions.push({
      version_number,
      published_at,
      data: structuredClone(rec.draft),
    });

    rec.status = "published";
    rec.updated_at = published_at;

    all[id] = rec;
    saveAll(all);

    return {
      scope_id: id,
      version_number,
      published_at,
    };
  }

  async listVersions(id: string): Promise<ScopeVersion[]> {
    const all = loadAll();
    const rec = all[id];
    if (!rec) throw new Error("Escopo não encontrado");
    return [...rec.versions].sort(
      (a, b) => b.version_number - a.version_number,
    );
  }
}
