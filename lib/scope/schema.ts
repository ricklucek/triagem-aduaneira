import { z } from "zod";
import { Currency, ModalType, OperationType, TaxRegime } from "@/lib/catalog/enums";
import { SERVICE_CODES } from "@/lib/catalog/services";

export const ScopeSchema = z.object({
  client: z.object({
    cnpj: z.string().nullable().optional(),
    razaoSocial: z.string().nullable().optional(),
    nomeFantasia: z.string().nullable().optional(),
    ie: z.string().nullable().optional(),
    im: z.string().nullable().optional(),
    regimeTributario: z.enum(TaxRegime).nullable().optional(),
    radarModalidade: z.string().nullable().optional(),
    enderecoEscritorio: z.string().nullable().optional(),
    enderecoArmazem: z.string().nullable().optional(),
    responsavelComercial: z.string().nullable().optional(),
  }),

  contacts: z.array(z.object({
    nome: z.string().nullable().optional(),
    cargoDepartamento: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
    telefone: z.string().nullable().optional(),
    observacao: z.string().nullable().optional(),
  })).default([]),

  operation: z.object({
    tipo: z.enum(OperationType).default("IMPORTACAO"),
    modal: z.enum(ModalType).nullable().optional(),
    localEntradaId: z.string().nullable().optional(),
    localLiberacaoId: z.string().nullable().optional(),
    ncm: z.array(z.string()).default([]),
    cnaePrincipal: z.string().nullable().optional(),
    cnaeSecundario: z.array(z.string()).default([]),
    anuencias: z.array(z.string()).default([]),
    impostos: z.array(z.string()).default([]),
    vinculos: z.array(z.string()).default([]),
    icmsPercentual: z.number().nullable().optional(),
    icmsRegra: z.string().nullable().optional(),
    destinacao: z.string().nullable().optional(),
    observacoes: z.string().nullable().optional(),
  }),

  services: z.array(z.object({
    codigo: z.enum(SERVICE_CODES),
    descricao: z.string().nullable().optional(),
    moeda: z.enum(Currency).default("BRL"),
    valor: z.number().nonnegative().nullable().optional(),
    regraCalculo: z.string().nullable().optional(),
    observacao: z.string().nullable().optional(),
  })).default([]),

  meta: z.object({
    status: z.enum(["draft", "published"]).default("draft"),
    version: z.number().int().min(1).default(1),
    source: z.enum(["DOCX", "PDF", "XLSX", "MANUAL"]).default("MANUAL"),
    updatedAt: z.string().default(() => new Date().toISOString()),
  }),
});

export type Scope = z.infer<typeof ScopeSchema>;

export const defaultScope: Scope = {
  client: {},
  contacts: [],
  operation: {
    tipo: "IMPORTACAO",
    ncm: [],
    cnaeSecundario: [],
    anuencias: [],
    impostos: [],
    vinculos: [],
  },
  services: [],
  meta: { status: "draft", version: 1, source: "MANUAL", updatedAt: new Date().toISOString() },
};