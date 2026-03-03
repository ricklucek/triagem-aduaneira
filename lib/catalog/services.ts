export const ServiceCatalog = [
  { code: "ASSESSORIA", label: "Assessoria", operations: ["IMPORTACAO","EXPORTACAO"] },
  { code: "DESEMBARACO", label: "Desembaraço", operations: ["IMPORTACAO","EXPORTACAO"] },
  { code: "FRETE_INTERNACIONAL", label: "Frete Internacional", operations: ["IMPORTACAO","EXPORTACAO"] },
  { code: "REGIMES_ESPECIAIS", label: "Regimes especiais", operations: ["IMPORTACAO","EXPORTACAO"] },
  { code: "SEGURO_INTERNACIONAL", label: "Seguro internacional", operations: ["IMPORTACAO","EXPORTACAO"] },
  { code: "TRANSPORTE_RODOVIARIO", label: "Transporte rodoviário", operations: ["IMPORTACAO","EXPORTACAO"] },
] as const;

export const SERVICE_CODES = ServiceCatalog.map(s => s.code) as unknown as readonly [
  typeof ServiceCatalog[number]["code"],
  ...typeof ServiceCatalog[number]["code"][]
];