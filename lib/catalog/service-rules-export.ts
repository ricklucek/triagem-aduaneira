export const ExportServiceRules = [
  {
    code: "CERTIFICADO_ORIGEM",
    label: "Certificado de Origem",
    operationScope: "EXPORTACAO" as const,
  },
  {
    code: "CERTIFICADO_FITOSSANITARIO",
    label: "Certificado Fitossanitário",
    operationScope: "EXPORTACAO" as const,
  },
  {
    code: "OUTROS_CERTIFICADOS",
    label: "Outros certificados",
    operationScope: "EXPORTACAO" as const,
  },
] as const;

export type ExportServiceCode = (typeof ExportServiceRules)[number]["code"];
