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

function makeSeed(): SeedRecord[] {
  const publishedAt = isoDaysAgo(1);

  return [
    {
      id: "seed-kezpo-001",
      status: "published",
      updated_at: publishedAt,
      last_published_at: publishedAt,
      version_count: 2,
      versions: [
        {
          version_number: 2,
          published_at: publishedAt,
          data: {
            ...structuredClone(escopoFormDefault),
            sobreEmpresa: {
              ...escopoFormDefault.sobreEmpresa,
              razaoSocial: "KEZPO SOLUTION LTDA",
              cnpj: "00000000000191",
              inscricaoEstadual: "123456789",
              enderecoCompletoEscritorio: "Av. Exemplo, 100 - São Paulo/SP",
              enderecoCompletoArmazem: "Rua Depósito, 50 - Itajaí/SC",
              cnaePrincipal: "6201500",
              regimeTributacao: "LUCRO_REAL",
              responsavelComercial: "EVERTON" as EscopoForm["sobreEmpresa"]["responsavelComercial"],
            },
          },
        },
        {
          version_number: 1,
          published_at: isoDaysAgo(5),
          data: structuredClone(escopoFormDefault),
        },
      ],
      draft: {
        ...structuredClone(escopoFormDefault),
        informacoesFixas: {
          salarioMinimoVigente: 1518,
          dadosBancariosCasco: {
            banco: "Banco do Brasil",
            agencia: "1234",
            conta: "99999-0",
          },
        },
        sobreEmpresa: {
          razaoSocial: "KEZPO SOLUTION LTDA",
          cnpj: "00000000000191",
          inscricaoEstadual: "123456789",
          inscricaoMunicipal: "",
          enderecoCompletoEscritorio: "Av. Exemplo, 100 - São Paulo/SP",
          enderecoCompletoArmazem: "Rua Depósito, 50 - Itajaí/SC",
          cnaePrincipal: "6201500",
          regimeTributacao: "LUCRO_REAL",
          responsavelComercial: "EVERTON" as EscopoForm["sobreEmpresa"]["responsavelComercial"],
        },
        contatos: [
          {
            nome: "Ana Comercial",
            cargoDepartamento: "Comercial",
            email: "ana@kezpo.com",
            telefone: "11999999999",
          },
        ],
        operacao: {
          tipos: ["IMPORTACAO"],
          importacao: {
            analistaDA: "ANNA",
            analistaAE: "KAROL",
            produtosImportados: "Componentes eletrônicos",
            ncms: [{ codigo: "85371020", possuiNve: null }],
            vinculoComExportador: "NAO",
            locaisEntrada: ["PARANAGUA_0917800"],
            outroLocalEntrada: "",
            armazensLiberacao: ["TCP_PARANAGUA_9801303"],
            outroArmazemLiberacao: "",
            necessidadeDtcDta: "NAO",
            necessidadeLiLpco: "NAO",
            anuencias: [],
            impostosFederais: {
              contaPagamento: "CASCO",
              ii: { regime: "INTEGRAL", detalheBeneficio: "" },
              ipi: { regime: "INTEGRAL", detalheBeneficio: "" },
              pis: { regime: "INTEGRAL", detalheBeneficio: "" },
              cofins: { regime: "INTEGRAL", detalheBeneficio: "" },
            },
            afrmm: {
              contaPagamento: "CASCO",
              regime: "INTEGRAL",
              detalheBeneficio: "",
            },
            icms: {
              contaPagamento: "CASCO",
              regime: "INTEGRAL",
              recolhida: "",
              efetiva: "",
            },
            destinacao: "REVENDA",
            subtipoConsumo: null,
          },
        },
        servicos: {
          importacao: {
            despachoAduaneiroImportacao: {
              habilitado: true,
              tipoValor: "OUTRO",
              valor: 1518,
              responsavel: "EVERTON",
            },
            preposto: {
              habilitado: true,
              valor: 250,
              inclusoNoDesembaracoCasco: "NAO",
            },
            emissaoLiLpco: { habilitado: false, valor: null },
            cadastroCatalogoProdutos: { habilitado: false, valor: null },
            assessoria: {
              habilitado: true,
              tipoValor: "SALARIO_MINIMO",
              valor: null,
              responsavel: "EVERTON",
            },
            freteInternacional: {
              habilitado: true,
              ptaxNegociado: "PTAX + 8%",
              percentualSobreCfr: 8,
            },
            seguroInternacional: {
              habilitado: true,
              valorNegociado: 0.99,
              descricaoComplementar: "0,99% do CIF",
              responsavel: "EVERTON",
            },
            freteRodoviario: {
              habilitado: true,
              modalidade: "CASO_A_CASO",
              responsavel: "EVERTON",
            },
            regimeEspecial: [],
            emissaoNfe: {
              habilitado: false,
              valor: null,
            },
          },
        },
        financeiro: {
          dadosBancariosClienteDevolucaoSaldo: {
            banco: "Itaú",
            agencia: "1234",
            conta: "56789-0",
          },
          observacoesFinanceiro: "Cliente solicita conferência prévia dos valores.",
        },
      },
    },

    {
      id: "seed-vexos-002",
      status: "draft",
      updated_at: isoDaysAgo(0),
      last_published_at: null,
      version_count: 0,
      versions: [],
      draft: {
        ...structuredClone(escopoFormDefault),
        sobreEmpresa: {
          ...escopoFormDefault.sobreEmpresa,
          razaoSocial: "VEXOS INDÚSTRIA E COMÉRCIO S/A",
          cnpj: "11111111000100",
          inscricaoEstadual: "998877665",
          enderecoCompletoEscritorio: "Rua Alfa, 200 - Campinas/SP",
          enderecoCompletoArmazem: "Rua Beta, 400 - Campinas/SP",
          cnaePrincipal: "4649401",
          regimeTributacao: "LUCRO_PRESUMIDO",
          responsavelComercial: "BERNARDO",
        },
      },
    },

    ...Array.from({ length: 18 }).map((_, i) => {
      const n = i + 3;
      return {
        id: `seed-demo-${String(n).padStart(3, "0")}`,
        status: n % 3 === 0 ? "published" : "draft" as SeedRecord["status"],
        updated_at: isoDaysAgo(n % 7),
        last_published_at: n % 3 === 0 ? isoDaysAgo(n % 7) : null,
        version_count: n % 3 === 0 ? 1 : 0,
        versions: n % 3 === 0
          ? [{ version_number: 1, published_at: isoDaysAgo(n % 7), data: structuredClone(escopoFormDefault) }]
          : [],
        draft: {
          ...structuredClone(escopoFormDefault),
          sobreEmpresa: {
            ...escopoFormDefault.sobreEmpresa,
            razaoSocial: `CLIENTE DEMO ${n}`,
            cnpj: String(20000000000000 + n),
            inscricaoEstadual: `IE${n}`,
            enderecoCompletoEscritorio: `Rua Escritório ${n}`,
            enderecoCompletoArmazem: `Rua Armazém ${n}`,
            cnaePrincipal: `CNAE${n}`,
            regimeTributacao: "SIMPLES_NACIONAL" as EscopoForm["sobreEmpresa"]["regimeTributacao"],
            responsavelComercial: "EVERTON" as EscopoForm["sobreEmpresa"]["responsavelComercial"],
          },
        },
      };
    }),
  ];
}

export class ScopeRepoSeed implements ScopeRepo {
  private data: SeedRecord[];

  constructor() {
    this.data = makeSeed();
  }

  async createScope(initial?: Partial<EscopoForm>): Promise<{ id: string }> {
    const id = `seed-new-${Date.now()}`;
    const draft: EscopoForm = {
      ...structuredClone(escopoFormDefault),
      ...initial,
    };

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

  async getScope(id: string): Promise<{ id: string; draft: EscopoForm; status: "draft" | "published" | "archived" }> {
    const rec = this.data.find((x) => x.id === id);
    if (!rec) throw new Error("Escopo não encontrado (seed).");
    return { id: rec.id, draft: rec.draft, status: rec.status };
  }

  async saveDraft(id: string, draft: EscopoForm): Promise<void> {
    const rec = this.data.find((x) => x.id === id);
    if (!rec) throw new Error("Escopo não encontrado (seed).");
    rec.draft = draft;
    rec.updated_at = new Date().toISOString();
    if (rec.status !== "archived") rec.status = "draft";
  }

  async listScopes(params: ListScopesParams): Promise<ListScopesResult> {
    const q = params.q?.toLowerCase().trim();
    const cnpj = params.cnpj?.replace(/\D/g, "");

    let filtered = [...this.data];

    if (params.status) filtered = filtered.filter((x) => x.status === params.status);
    if (cnpj) {
      filtered = filtered.filter(
        (x) => (x.draft.sobreEmpresa.cnpj ?? "").replace(/\D/g, "") === cnpj
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
    const itemsSlice = filtered.slice(params.offset, params.offset + params.limit);

    const items: ScopeSummary[] = itemsSlice.map((x) => ({
      id: x.id,
      cnpj: x.draft.sobreEmpresa.cnpj ?? "",
      razao_social: x.draft.sobreEmpresa.razaoSocial ?? "",
      status: x.status,
      updated_at: x.updated_at,
      last_published_at: x.last_published_at,
      version_count: x.version_count,
      completeness_score: calculateCompleteness(x.draft),
    }));

    return { items, total, limit: params.limit, offset: params.offset };
  }

  async publish(id: string): Promise<PublishResult> {
    const rec = this.data.find((x) => x.id === id);
    if (!rec) throw new Error("Escopo não encontrado (seed).");

    const version_number = rec.versions.length + 1;
    const published_at = new Date().toISOString();

    rec.versions.unshift({
      version_number,
      published_at,
      data: structuredClone(rec.draft),
    });

    rec.version_count = rec.versions.length;
    rec.last_published_at = published_at;
    rec.status = "published";
    rec.updated_at = published_at;

    return { scope_id: id, version_number, published_at };
  }

  async listVersions(id: string): Promise<ScopeVersion[]> {
    const rec = this.data.find((x) => x.id === id);
    if (!rec) throw new Error("Escopo não encontrado (seed).");
    return [...rec.versions].sort((a, b) => b.version_number - a.version_number);
  }
}