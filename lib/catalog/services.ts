export type OperationScope = "IMPORTACAO" | "EXPORTACAO";
export type Currency = "BRL" | "USD" | "EUR";

/**
 * Como o UI deve se comportar ao configurar um serviço.
 * (O schema do escopo continua sendo genérico: currency/pricingModel/amount/percent/textRule/extra)
 * Aqui a gente descreve o "contrato" do formulário.
 */
export type ServiceUiMode =
  | "SALARY_MINIMUM_OR_FIXED" // dropdown: salário mínimo ou outro valor (amount)
  | "YESNO_AMOUNT" // dropdown sim/não; se sim -> amount
  | "YESNO_AMOUNT_TEXT" // dropdown sim/não; se sim -> text + amount
  | "PTAX_PERCENT" // texto "PTAX negociado" + percent
  | "NEGOTIATED_AMOUNT_TEXT" // amount + text (obs/critério)
  | "YES_OR_CASE_BY_CASE" // dropdown: sim / caso a caso
  | "NOTE_AND_AMOUNT_REPEATABLE"; // notes + amount, permite múltiplas ocorrências

export type ServiceCatalogItem = {
  code: string;
  label: string;
  operations: readonly OperationScope[];

  // UI metadata (não entra no snapshot, só guia o StepServices)
  ui: {
    mode: ServiceUiMode;
    defaultCurrency?: Currency;

    // se true, o usuário pode adicionar o mesmo serviço mais de uma vez
    repeatable?: boolean;

    // hints para o StepServices
    helpers?: {
      showIncludedInDesembaraço?: boolean; // Preposto
      showPtaxLabel?: boolean; // Frete Internacional
    };
  };
};

/**
 * Catálogo alinhado com o documento "Atualização do escopo".
 */
export const ServiceCatalog = [
  // ===== Importação =====
  {
    code: "DESPACHO_ADUANEIRO_IMPORTACAO",
    label: "Despacho Aduaneiro (Importação)",
    operations: ["IMPORTACAO"],
    ui: { mode: "SALARY_MINIMUM_OR_FIXED", defaultCurrency: "BRL" },
  },

  {
    code: "PREPOSTO",
    label: "Preposto",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: {
      mode: "YESNO_AMOUNT",
      defaultCurrency: "BRL",
      helpers: { showIncludedInDesembaraço: true },
    },
  },

  {
    code: "EMISSAO_LI_LPCO",
    label: "Emissão de LI/LPCO",
    operations: ["IMPORTACAO"],
    ui: { mode: "YESNO_AMOUNT", defaultCurrency: "BRL" },
  },

  {
    code: "ASSESSORIA",
    label: "Assessoria",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: { mode: "SALARY_MINIMUM_OR_FIXED", defaultCurrency: "BRL" },
  },

  {
    code: "FRETE_INTERNACIONAL",
    label: "Frete Internacional",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: {
      mode: "PTAX_PERCENT",
      defaultCurrency: "USD",
      helpers: { showPtaxLabel: true },
    },
  },

  {
    code: "SEGURO_INTERNACIONAL",
    label: "Seguro Internacional",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: { mode: "NEGOTIATED_AMOUNT_TEXT", defaultCurrency: "USD" },
  },

  {
    code: "FRETE_RODOVIARIO",
    label: "Frete Rodoviário",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: { mode: "YES_OR_CASE_BY_CASE", defaultCurrency: "BRL" },
  },

  {
    code: "REGIME_ESPECIAL",
    label: "Regime Especial",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: {
      mode: "NOTE_AND_AMOUNT_REPEATABLE",
      defaultCurrency: "BRL",
      repeatable: true,
    },
  },

  {
    code: "EMISSAO_NFE",
    label: "Emissão de NFE",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: { mode: "YESNO_AMOUNT", defaultCurrency: "BRL" },
  },

  {
    code: "CADASTRO_CATALOGO_PRODUTOS",
    label: "Cadastro de Catálogo de Produtos",
    operations: ["IMPORTACAO", "EXPORTACAO"],
    ui: { mode: "YESNO_AMOUNT", defaultCurrency: "BRL" },
  },

  // ===== Exportação =====
  {
    code: "DESPACHO_ADUANEIRO_EXPORTACAO",
    label: "Despacho Aduaneiro (Exportação)",
    operations: ["EXPORTACAO"],
    ui: { mode: "SALARY_MINIMUM_OR_FIXED", defaultCurrency: "BRL" },
  },

  {
    code: "CERTIFICADO_ORIGEM",
    label: "Certificado de Origem",
    operations: ["EXPORTACAO"],
    ui: { mode: "YESNO_AMOUNT", defaultCurrency: "BRL" },
  },

  {
    code: "CERTIFICADO_FITOSSANITARIO",
    label: "Certificado Fitossanitário",
    operations: ["EXPORTACAO"],
    ui: { mode: "YESNO_AMOUNT", defaultCurrency: "BRL" },
  },

  {
    code: "OUTROS_CERTIFICADOS",
    label: "Outros certificados",
    operations: ["EXPORTACAO"],
    ui: { mode: "YESNO_AMOUNT_TEXT", defaultCurrency: "BRL" },
  },
] as const satisfies readonly ServiceCatalogItem[];

// lista de codes para selects/validação auxiliar
export const SERVICE_CODES = ServiceCatalog.map(
  (s) => s.code,
) as unknown as readonly [
  (typeof ServiceCatalog)[number]["code"],
  ...(typeof ServiceCatalog)[number]["code"][],
];

/**
 * Aliases para compatibilidade com codes antigos do protótipo (se você já gravou escopos no localStorage).
 * Ex.: "DESEMBARACO" pode ser tratado como "DESPACHO_ADUANEIRO_IMPORTACAO" dependendo do scope.
 */
export const ServiceCodeAliases: Record<string, string> = {
  DESEMBARACO: "DESPACHO_ADUANEIRO_IMPORTACAO",
  TRANSPORTE_RODOVIARIO: "FRETE_RODOVIARIO",
  REGIMES_ESPECIAIS: "REGIME_ESPECIAL",
};
