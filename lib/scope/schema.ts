import { z } from "zod";
import { Currency, ModalType, OperationType, TaxRegime } from "@/lib/catalog/enums";

export const ScopeSchema = z.object({
  // Config global (tenant) referenciada (no MVP pode ser hardcoded e opcional)
  // Se você quiser carimbar no snapshot publicado, mantenha aqui:
  globalsSnapshot: z
    .object({
      salaryMinimumBRL: z.number().nonnegative().default(1518),
      cascoBank: z
        .object({
          bank: z.string().nullable().optional(),
          agency: z.string().nullable().optional(),
          account: z.string().nullable().optional(),
          pixKey: z.string().nullable().optional(),
        })
        .default({}),
    })
    .default({ salaryMinimumBRL: 1518, cascoBank: {} }),

  client: z.object({
    cnpj: z.string().nullable().optional(),
    razaoSocial: z.string().nullable().optional(),
    nomeFantasia: z.string().nullable().optional(),
    ie: z.string().nullable().optional(),
    im: z.string().nullable().optional(),
    regimeTributario: z.enum(TaxRegime).nullable().optional(),
    radarModalidade: z.string().nullable().optional(), // integração futura
    enderecoEscritorio: z.string().nullable().optional(),
    enderecoArmazem: z.string().nullable().optional(),
    responsavelComercialId: z.string().nullable().optional(), // catálogo (pessoas)
  }),

  contacts: z
    .array(
      z.object({
        nome: z.string().nullable().optional(),
        cargoDepartamento: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        telefone: z.string().nullable().optional(),
        observacao: z.string().nullable().optional(),
      })
    )
    .default([]),

  // Operação agora é multi-seleção
  operation: z.object({
    types: z.array(z.enum(OperationType)).default([]), // [] = nada selecionado
  }),

  // Seção de Importação (habilitada quando operation.types inclui IMPORTACAO)
  importSection: z
    .object({
      modal: z.enum(ModalType).nullable().optional(),

      // Multi-select com catálogo
      entryLocations: z.array(z.string()).default([]), // URF/Porto/Aeroporto etc
      releaseWarehouses: z.array(z.string()).default([]), // armazém/códigos

      // Arrays
      ncm: z.array(z.string()).default([]),
      cnaePrincipal: z.string().nullable().optional(),
      cnaeSecundario: z.array(z.string()).default([]),

      // Condicionais (vamos deixar estrutura pronta, mas UI pode vir depois)
      liLpco: z
        .object({
          enabled: z.boolean().default(false),
          anuencias: z.array(z.string()).default([]), // órgãos
        })
        .default({ enabled: false, anuencias: [] }),
    })
    .default({
      entryLocations: [],
      releaseWarehouses: [],
      ncm: [],
      cnaeSecundario: [],
      liLpco: { enabled: false, anuencias: [] },
    }),

  // Seção de Exportação (vamos ligar depois)
  exportSection: z
    .object({
      modal: z.enum(ModalType).nullable().optional(),
      departureLocations: z.array(z.string()).default([]), // portos/fronteiras
      ncm: z.array(z.string()).default([]),
      cnaeSecundario: z.array(z.string()).default([]),
    })
    .default({
      departureLocations: [],
      ncm: [],
      cnaeSecundario: [],
    }),

  /**
   * Serviços “rule-driven” (base pronta).
   * Por enquanto podemos manter UI simples, mas o modelo já suporta regras específicas.
   */
  services: z
    .array(
      z.object({
        operationScope: z.enum(["IMPORTACAO", "EXPORTACAO"]),
        code: z.string(), // depois trocamos para enum de catálogo rule-driven
        enabled: z.boolean().default(true),

        // pricing
        currency: z.enum(Currency).default("BRL"),
        pricingModel: z.enum(["FIXED", "PERCENT", "TEXT", "SALARY_MINIMUM"]).default("FIXED"),

        amount: z.number().nonnegative().nullable().optional(), // FIXED
        percent: z.number().nonnegative().nullable().optional(), // PERCENT
        textRule: z.string().nullable().optional(), // TEXT (ex: PTAX 8%)
        // SALARY_MINIMUM => amount opcional (se quiser override), senão usa globalsSnapshot.salaryMinimumBRL

        notes: z.string().nullable().optional(),
        // campos específicos por serviço podem entrar aqui sem quebrar:
        extra: z.record(z.any(), z.any()).default({}),
      })
    )
    .default([]),

  meta: z.object({
    status: z.enum(["draft", "published"]).default("draft"),
    version: z.number().int().min(1).default(1),
    source: z.enum(["DOCX", "PDF", "XLSX", "MANUAL"]).default("MANUAL"),
    updatedAt: z.string().default(() => new Date().toISOString()),
  }),
});

export type Scope = z.infer<typeof ScopeSchema>;

export const defaultScope: Scope = {
  globalsSnapshot: { salaryMinimumBRL: 1518, cascoBank: {} },
  client: {},
  contacts: [],
  operation: { types: [] },
  importSection: {
    modal: null,
    entryLocations: [],
    releaseWarehouses: [],
    ncm: [],
    cnaePrincipal: null,
    cnaeSecundario: [],
    liLpco: { enabled: false, anuencias: [] },
  },
  exportSection: {
    modal: null,
    departureLocations: [],
    ncm: [],
    cnaeSecundario: [],
  },
  services: [],
  meta: { status: "draft", version: 1, source: "MANUAL", updatedAt: new Date().toISOString() },
};