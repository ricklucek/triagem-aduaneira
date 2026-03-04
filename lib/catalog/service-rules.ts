export const ImportServiceRules = [
  {
    code: "DESPACHO_ADUANEIRO",
    label: "Despacho Aduaneiro",
    operationScope: "IMPORTACAO" as const,
  },
  {
    code: "PREPOSTO",
    label: "Preposto",
    operationScope: "IMPORTACAO" as const,
  },
  {
    code: "FRETE_INTERNACIONAL",
    label: "Frete Internacional",
    operationScope: "IMPORTACAO" as const,
  },
] as const;

export type ImportServiceCode = typeof ImportServiceRules[number]["code"];