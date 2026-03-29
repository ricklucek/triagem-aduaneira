import {
  ScopeRepo,
  ListScopesParams,
  ListScopesResult,
  ScopeSummary,
  ScopeVersion,
  PublishResult,
} from "./ScopeRepo";
import { EscopoForm } from "@/domain/scope/types";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { calculateCompleteness } from "@/domain/scope/completeness";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
type SeedRecord = {
  id: string;
  status: "draft" | "published" | "archived";
  updated_at: string;
  last_published_at: string | null;
  version_count: number;
  draft: EscopoForm;
  versions: ScopeVersion[];
};
const baseDraft = (overrides?: Partial<EscopoForm>): EscopoForm => ({
  ...structuredClone(escopoFormDefault),
  ...overrides,
  sobreEmpresa: {
    ...structuredClone(escopoFormDefault.sobreEmpresa),
    ...(overrides?.sobreEmpresa ?? {}),
  },
});
function makeSeed(): SeedRecord[] {
  const publishedAt = isoDaysAgo(1);
  return [
    {
      id: "seed-kezpo-001",
      status: "published",
      updated_at: publishedAt,
      last_published_at: publishedAt,
      version_count: 1,
      versions: [
        {
          version_number: 1,
          published_at: publishedAt,
          data: baseDraft({
            sobreEmpresa: {
              razaoSocial: "KEZPO SOLUTION LTDA",
              cnpj: "00000000000191",
              inscricaoEstadual: "123456789",
              enderecoCompletoEscritorio: "Av. Exemplo, 100 - São Paulo/SP",
              enderecoCompletoArmazem: "Rua Depósito, 50 - Itajaí/SC",
              cnaePrincipal: "6201500",
              regimeTributacao: "LUCRO_REAL",
              responsavelComercial: "EVERTON",
            },
          }),
        },
      ],
      draft: baseDraft({
        sobreEmpresa: {
          razaoSocial: "KEZPO SOLUTION LTDA",
          cnpj: "00000000000191",
          inscricaoEstadual: "123456789",
          enderecoCompletoEscritorio: "Av. Exemplo, 100 - São Paulo/SP",
          enderecoCompletoArmazem: "Rua Depósito, 50 - Itajaí/SC",
          cnaePrincipal: "6201500",
          regimeTributacao: "LUCRO_REAL",
          responsavelComercial: "EVERTON",
        },
      }),
    },
  ];
}

export class ScopeRepoSeed implements ScopeRepo {
  private data: SeedRecord[] = makeSeed();
  async createScope(initial?: Partial<EscopoForm>): Promise<{ id: string }> {
    const id = `seed-new-${Date.now()}`;
    const draft = {
      ...structuredClone(escopoFormDefault),
      ...initial,
    } as EscopoForm;
    this.data.unshift({
      id,
      status: "draft",
      updated_at: new Date().toISOString(),
      last_published_at: null,
      version_count: 0,
      draft,
      versions: [],
    });
    return { id };
  }
  async getScope(id: string) {
    const item = this.data.find((x) => x.id === id);
    if (!item) throw new Error("Scope não encontrado");
    return {
      id: item.id,
      draft: structuredClone(item.draft),
      status: item.status,
    };
  }
  async saveDraft(id: string, draft: EscopoForm): Promise<void> {
    const item = this.data.find((x) => x.id === id);
    if (!item) throw new Error("Scope não encontrado");
    item.draft = structuredClone(draft);
    item.updated_at = new Date().toISOString();
  }
  async listScopes(params: ListScopesParams): Promise<ListScopesResult> {
    const start = params.offset ?? 0;
    const limit = params.limit ?? 10;
    const items = this.data
      .slice(start, start + limit)
      .map<ScopeSummary>((item) => ({
        id: item.id,
        cnpj: item.draft.sobreEmpresa.cnpj,
        razao_social: item.draft.sobreEmpresa.razaoSocial,
        status: item.status,
        updated_at: item.updated_at,
        last_published_at: item.last_published_at,
        version_count: item.version_count,
        completeness_score: calculateCompleteness(item.draft),
      }));
    return { items, total: this.data.length, limit, offset: start };
  }
  async publish(id: string): Promise<PublishResult> {
    const item = this.data.find((x) => x.id === id);
    if (!item) throw new Error("Scope não encontrado");
    const published_at = new Date().toISOString();
    item.status = "published";
    item.last_published_at = published_at;
    item.version_count += 1;
    item.versions.unshift({
      version_number: item.version_count,
      published_at,
      data: structuredClone(item.draft),
    });
    return { scope_id: id, version_number: item.version_count, published_at };
  }
  async listVersions(id: string): Promise<ScopeVersion[]> {
    return structuredClone(this.data.find((x) => x.id === id)?.versions ?? []);
  }
}
