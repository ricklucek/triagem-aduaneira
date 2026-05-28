import { z } from "zod";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === "" ? null : value ?? null));

const requiredTrimmedString = (message: string) =>
  z.string().trim().min(1, message);

const optionalBoolean = z.boolean().optional().nullable();

const nullableNumberLike = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((value) => {
    if (value === "" || value == null) return null;

    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }

    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);

    return Number.isNaN(parsed) ? value : parsed;
  });

const positiveNumberLike = (message: string) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .superRefine((value, ctx) => {
      if (value === "" || value == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
        });
        return;
      }

      const parsed =
        typeof value === "number" ? value : Number(value.replace(",", "."));

      if (Number.isNaN(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
        });
      }
    });

const requiredUuid = (message: string) =>
  z.string().trim().min(1, message);

const optionalId = z.string().trim().optional().nullable();

const arrayOfStrings = z.array(z.string().trim().min(1)).default([]);

// -----------------------------------------------------------------------------
// Enums canônicos
// -----------------------------------------------------------------------------

export const OperationTypeSchema = z.enum(["IMPORT", "EXPORT"]);

export const LocationTypeSchema = z.enum(["ENTRY", "CUSTOMS_CLEARANCE"]);

export const DestinationPurposeSchema = z.enum([
  "RESALE",
  "INDUSTRIALIZATION",
  "USE_AND_CONSUMPTION",
  "FIXED_ASSET",
]);

export const AccountOwnerTypeSchema = z.enum(["CASCO", "CLIENT"]);

export const TaxRegimeSchema = z.enum([
  "FULL",
  "EXEMPTION",
  "SUSPENSION",
  "REDUCTION",
  "OTHER",
]);

export const CompanyTaxRegimeSchema = z.enum([
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
  "LUCRO_REAL",
  "LUCRO_PRESUMIDO_OU_REAL",
]);

export const RadarModeSchema = z.enum([
  "RADAR_INATIVO",
  "RADAR_LIMITADO_50K",
  "RADAR_LIMITADO_150K",
  "RADAR_ILIMITADO",
]);

export const PaymentPreferenceSchema = z.enum([
  "BANK_TRANSFER",
  "PIX",
  "BANK_SLIP",
  "OTHER",
]);

export const PricingTypeSchema = z.enum([
  "FIXED",
  "PERCENTAGE",
  "MINIMUM_AMOUNT",
  "SALARY_BASED",
  "CASE_BY_CASE",
  "INCLUDED",
  "OTHER",
]);

export const PricingReferenceSchema = z.enum([
  "SALARIO_MINIMO",
  "MEIO_SALARIO_MINIMO",
  "OUTRO",
]);

export const ServiceTypeSchema = z.enum([
  "CUSTOMS_CLEARANCE",
  "PREPOSTO",
  "LI_LPCO_ISSUANCE",
  "PRODUCT_CATALOG_REGISTRATION",
  "CONSULTING",
  "INTERNATIONAL_FREIGHT",
  "INTERNATIONAL_INSURANCE",
  "ROAD_FREIGHT",
  "NFE_ISSUANCE",
  "ORIGIN_CERTIFICATE",
  "PHYTOSANITARY_CERTIFICATE",
  "OTHER_CERTIFICATE",
  "SPECIAL_REGIME",
  "OTHER",
]);

export const ServiceDetailTypeSchema = z.enum([
  "FREIGHT",
  "INSURANCE",
  "CUSTOMS_BROKER",
  "CERTIFICATE",
]);

export const FreightModeSchema = z.enum(["YES", "CASE_BY_CASE", "CASO_A_CASO"]);

export const PrepostoOriginSchema = z.enum(["API", "MANUAL"]);

// -----------------------------------------------------------------------------
// Company / contacts / assignments
// -----------------------------------------------------------------------------

export const CompanyDraftSchema = z.object({
  taxId: requiredTrimmedString("CNPJ é obrigatório").min(
    14,
    "CNPJ deve conter ao menos 14 caracteres",
  ),
  legalName: requiredTrimmedString("Razão social é obrigatória"),
  tradeName: optionalTrimmedString,
  stateRegistration: optionalTrimmedString,
  municipalRegistration: optionalTrimmedString,
  officeAddress: requiredTrimmedString("Endereço do escritório é obrigatório"),
  warehouseAddress: optionalTrimmedString,
  mainCnae: requiredTrimmedString("CNAE principal é obrigatório"),
  secondaryCnae: optionalTrimmedString,
  taxRegime: CompanyTaxRegimeSchema,
  radarMode: RadarModeSchema,
});

export const ContactDraftSchema = z.object({
  id: optionalId,
  name: requiredTrimmedString("Nome é obrigatório"),
  departmentRole: requiredTrimmedString("Cargo/Departamento é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  phone: requiredTrimmedString("Telefone é obrigatório"),
  whatsapp: optionalTrimmedString,
  primary: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const AssignmentsDraftSchema = z.object({
  commercialResponsibleId: requiredUuid("Responsável comercial é obrigatório"),
  importDaAnalystIds: z.array(requiredUuid("Analista DA é obrigatório")).default([]),
  importAeAnalystIds: z.array(requiredUuid("Analista AE é obrigatório")).default([]),
  exportDaAnalystIds: z.array(requiredUuid("Analista DA é obrigatório")).default([]),
  exportAeAnalystIds: z.array(requiredUuid("Analista AE é obrigatório")).default([]),
});

// -----------------------------------------------------------------------------
// Operations
// -----------------------------------------------------------------------------

export const NcmDraftSchema = z.object({
  id: optionalId,
  code: requiredTrimmedString("NCM é obrigatório"),
  description: optionalTrimmedString,
  hasBenefit: optionalBoolean,
  benefitDescription: optionalTrimmedString,
});

export const OperationLocationDraftSchema = z.object({
  id: optionalId,
  type: LocationTypeSchema,
  code: optionalTrimmedString,
  name: requiredTrimmedString("Nome do local é obrigatório"),
  rawValue: optionalTrimmedString,
});

export const OperationAuthorityDraftSchema = z.object({
  id: optionalId,
  code: optionalTrimmedString,
  name: requiredTrimmedString("Órgão anuente é obrigatório"),
});

export const DestinationPurposeDraftSchema = z.object({
  id: optionalId,
  purpose: DestinationPurposeSchema,
  consumptionSubtype: optionalTrimmedString,
});

export const OperationDraftSchema = z
  .object({
    id: optionalId,
    operationType: OperationTypeSchema,

    productsDescription: requiredTrimmedString("Descrição dos produtos é obrigatória"),
    ncmNotes: optionalTrimmedString,

    hasExporterRelationship: optionalBoolean,
    requiresDtc: optionalBoolean,
    requiresDta: optionalBoolean,
    requiresLiLpco: optionalBoolean,

    otherAuthority: optionalTrimmedString,

    ncms: z.array(NcmDraftSchema).default([]),
    entryLocations: z.array(OperationLocationDraftSchema).default([]),
    customsClearanceLocations: z.array(OperationLocationDraftSchema).default([]),
    authorities: z.array(OperationAuthorityDraftSchema).default([]),
    destinationPurposes: z.array(DestinationPurposeDraftSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.ncms.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ncms"],
        message: "Informe ao menos um NCM",
      });
    }

    if (value.destinationPurposes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationPurposes"],
        message: "Informe ao menos uma destinação",
      });
    }

    const hasUseAndConsumption = value.destinationPurposes.some(
      (item) => item.purpose === "USE_AND_CONSUMPTION",
    );

    if (hasUseAndConsumption) {
      value.destinationPurposes.forEach((item, index) => {
        if (item.purpose === "USE_AND_CONSUMPTION" && !item.consumptionSubtype) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["destinationPurposes", index, "consumptionSubtype"],
            message: "Subtipo de consumo é obrigatório",
          });
        }
      });
    }

    if (value.operationType === "IMPORT") {
      if (value.hasExporterRelationship == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hasExporterRelationship"],
          message: "Informe se há vínculo com o exportador",
        });
      }

      if (value.requiresDta == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiresDta"],
          message: "Necessidade de DTA é obrigatória",
        });
      }

      if (value.requiresDtc == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiresDtc"],
          message: "Necessidade de DTC é obrigatória",
        });
      }

      if (value.requiresLiLpco == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiresLiLpco"],
          message: "Necessidade de LI/LPCO é obrigatória",
        });
      }

      if (value.entryLocations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entryLocations"],
          message: "Informe ao menos um local de entrada",
        });
      }

      if (value.customsClearanceLocations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customsClearanceLocations"],
          message: "Informe ao menos um local de desembaraço",
        });
      }
    }
  });

export const OperationsDraftSchema = z
  .object({
    types: z.array(OperationTypeSchema).min(1, "Selecione ao menos uma operação"),
    importOperation: OperationDraftSchema.optional().nullable(),
    exportOperation: OperationDraftSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasImport = value.types.includes("IMPORT");
    const hasExport = value.types.includes("EXPORT");

    if (hasImport && !value.importOperation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["importOperation"],
        message: "Bloco de importação é obrigatório",
      });
    }

    if (hasExport && !value.exportOperation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exportOperation"],
        message: "Bloco de exportação é obrigatório",
      });
    }

    if (value.importOperation && value.importOperation.operationType !== "IMPORT") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["importOperation", "operationType"],
        message: "Tipo de operação inválido para o bloco de importação",
      });
    }

    if (value.exportOperation && value.exportOperation.operationType !== "EXPORT") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exportOperation", "operationType"],
        message: "Tipo de operação inválido para o bloco de exportação",
      });
    }
  });

// -----------------------------------------------------------------------------
// Taxes
// -----------------------------------------------------------------------------

export const TaxBankAccountDraftSchema = z.object({
  bankName: optionalTrimmedString,
  bankBranch: optionalTrimmedString,
  bankAccount: optionalTrimmedString,
});

const requireBankAccountWhenClient = (
  value: {
    paymentAccountType?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccount?: string | null;
  },
  ctx: z.RefinementCtx,
) => {
  if (value.paymentAccountType !== "CLIENT") return;

  if (!value.bankName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bankName"],
      message: "Banco é obrigatório quando a conta for do cliente",
    });
  }

  if (!value.bankBranch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bankBranch"],
      message: "Agência é obrigatória quando a conta for do cliente",
    });
  }

  if (!value.bankAccount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bankAccount"],
      message: "Conta é obrigatória quando a conta for do cliente",
    });
  }
};

export const FederalTaxesDraftSchema = z
  .object({
    id: optionalId,
    paymentAccountType: AccountOwnerTypeSchema,

    bankName: optionalTrimmedString,
    bankBranch: optionalTrimmedString,
    bankAccount: optionalTrimmedString,

    iiRegime: TaxRegimeSchema,
    iiBenefitDetail: optionalTrimmedString,

    ipiRegime: TaxRegimeSchema,
    ipiBenefitDetail: optionalTrimmedString,

    pisRegime: TaxRegimeSchema,
    pisBenefitDetail: optionalTrimmedString,

    cofinsRegime: TaxRegimeSchema,
    cofinsBenefitDetail: optionalTrimmedString,

    notes: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    requireBankAccountWhenClient(value, ctx);

    const benefitFields = [
      ["iiRegime", "iiBenefitDetail", "Detalhe do benefício de II é obrigatório"],
      ["ipiRegime", "ipiBenefitDetail", "Detalhe do benefício de IPI é obrigatório"],
      ["pisRegime", "pisBenefitDetail", "Detalhe do benefício de PIS é obrigatório"],
      ["cofinsRegime", "cofinsBenefitDetail", "Detalhe do benefício de COFINS é obrigatório"],
    ] as const;

    benefitFields.forEach(([regimeField, detailField, message]) => {
      if (value[regimeField] !== "FULL" && !value[detailField]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [detailField],
          message,
        });
      }
    });
  });

export const AfrmmDraftSchema = z
  .object({
    id: optionalId,
    paymentAccountType: AccountOwnerTypeSchema,
    bankName: optionalTrimmedString,
    bankBranch: optionalTrimmedString,
    bankAccount: optionalTrimmedString,
    regime: TaxRegimeSchema,
    benefitDetail: optionalTrimmedString,
    notes: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    requireBankAccountWhenClient(value, ctx);

    if (value.regime !== "FULL" && !value.benefitDetail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["benefitDetail"],
        message: "Detalhe do benefício é obrigatório",
      });
    }
  });

export const IcmsDestinationRateDraftSchema = z.object({
  id: optionalId,
  destinationPurpose: DestinationPurposeSchema,
  collectedRate: nullableNumberLike,
  effectiveRate: nullableNumberLike,
  regime: TaxRegimeSchema.optional().nullable(),
  notes: optionalTrimmedString,
});

export const IcmsDraftSchema = z
  .object({
    id: optionalId,
    paymentAccountType: AccountOwnerTypeSchema,
    bankName: optionalTrimmedString,
    bankBranch: optionalTrimmedString,
    bankAccount: optionalTrimmedString,
    regime: TaxRegimeSchema,
    collectedRate: nullableNumberLike,
    effectiveRate: nullableNumberLike,
    notes: optionalTrimmedString,
    destinationRates: z.array(IcmsDestinationRateDraftSchema).default([]),
  })
  .superRefine((value, ctx) => {
    requireBankAccountWhenClient(value, ctx);
  });

export const OperationTaxesDraftSchema = z.object({
  federalTaxes: FederalTaxesDraftSchema.optional().nullable(),
  afrmm: AfrmmDraftSchema.optional().nullable(),
  icms: IcmsDraftSchema.optional().nullable(),
});

export const TaxesDraftSchema = z.object({
  importTaxes: OperationTaxesDraftSchema.optional().nullable(),
  exportTaxes: OperationTaxesDraftSchema.optional().nullable(),
});

// -----------------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------------

export const FreightServiceDetailDraftSchema = z.object({
  type: z.literal("FREIGHT"),
  id: optionalId,
  mode: FreightModeSchema.optional().nullable(),
  negotiatedPtax: nullableNumberLike,
  generalNotes: optionalTrimmedString,
});

export const InsuranceServiceDetailDraftSchema = z.object({
  type: z.literal("INSURANCE"),
  id: optionalId,
  minimumAmount: nullableNumberLike,
  cfrPercentage: nullableNumberLike,
  policyInclusionDate: z.string().trim().optional().nullable(),
  additionalDescription: optionalTrimmedString,
});

export const CustomsBrokerServiceDetailDraftSchema = z.object({
  type: z.literal("CUSTOMS_BROKER"),
  id: optionalId,
  pricingReference: PricingReferenceSchema.optional().nullable(),
  salaryMultiplier: nullableNumberLike,
});

export const CertificateServiceDetailDraftSchema = z.object({
  type: z.literal("CERTIFICATE"),
  id: optionalId,
  certificateName: optionalTrimmedString,
  issuingAuthority: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export const ServiceDetailDraftSchema = z.discriminatedUnion("type", [
  FreightServiceDetailDraftSchema,
  InsuranceServiceDetailDraftSchema,
  CustomsBrokerServiceDetailDraftSchema,
  CertificateServiceDetailDraftSchema,
]);

export const ServiceItemDraftSchema = z
  .object({
    id: optionalId,
    catalogId: optionalId,
    code: optionalTrimmedString,
    serviceType: ServiceTypeSchema,
    operationType: OperationTypeSchema,
    enabled: z.boolean().default(false),
    pricingType: PricingTypeSchema.optional().nullable(),
    amount: nullableNumberLike,
    currency: z.string().trim().default("BRL"),
    responsibleUserId: optionalId,
    lastUpdatedOn: z.string().trim().optional().nullable(),
    notes: optionalTrimmedString,
    details: ServiceDetailDraftSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (!value.pricingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricingType"],
        message: "Tipo de cobrança é obrigatório",
      });
    }

    if (
      ["FIXED", "PERCENTAGE", "MINIMUM_AMOUNT"].includes(value.pricingType ?? "") &&
      (value.amount == null || value.amount === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Valor é obrigatório",
      });
    }

    if (value.pricingType === "SALARY_BASED") {
      const detail = value.details;

      if (!detail || detail.type !== "CUSTOMS_BROKER") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details"],
          message: "Detalhes de cobrança por salário mínimo são obrigatórios",
        });
      } else if (!detail.pricingReference) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details", "pricingReference"],
          message: "Referência de cobrança é obrigatória",
        });
      }
    }

    if (value.serviceType === "INTERNATIONAL_FREIGHT" || value.serviceType === "ROAD_FREIGHT") {
      const detail = value.details;

      if (!detail || detail.type !== "FREIGHT") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details"],
          message: "Detalhes do frete são obrigatórios",
        });
      } else if (!detail.mode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details", "mode"],
          message: "Modalidade do frete é obrigatória",
        });
      }
    }

    if (value.serviceType === "INTERNATIONAL_INSURANCE") {
      const detail = value.details;

      if (!detail || detail.type !== "INSURANCE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details"],
          message: "Detalhes do seguro são obrigatórios",
        });
      } else if (detail.cfrPercentage == null || detail.cfrPercentage === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["details", "cfrPercentage"],
          message: "% sobre frete + mercadoria é obrigatório",
        });
      }
    }
  });

export const PrepostoCityDraftSchema = z.object({
  id: optionalId,
  city: requiredTrimmedString("Cidade é obrigatória"),
  state: optionalTrimmedString,
});

export const PrepostoDraftSchema = z
  .object({
    id: optionalId,
    prepostoId: optionalId,
    prepostoName: optionalTrimmedString,
    manualPrepostoName: optionalTrimmedString,
    manualPrepostoNotes: optionalTrimmedString,
    origin: PrepostoOriginSchema.optional().default("API"),
    operationType: OperationTypeSchema,
    enabled: z.boolean().default(false),
    amount: nullableNumberLike,
    includedInCascoCustomsClearance: optionalBoolean,
    otherPort: optionalTrimmedString,
    otherBorder: optionalTrimmedString,
    notes: optionalTrimmedString,
    cities: z.array(PrepostoCityDraftSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled) return;

    if (value.includedInCascoCustomsClearance == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["includedInCascoCustomsClearance"],
        message: "Informe se está incluso no desembaraço CASCO",
      });
    }

    const hasApiPreposto = Boolean(value.prepostoId);
    const hasManualPreposto = Boolean(value.manualPrepostoName);

    if (!hasApiPreposto && !hasManualPreposto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prepostoId"],
        message: "Selecione um preposto ou informe um preposto manual",
      });
    }
  });

export const ServicesDraftSchema = z.object({
  items: z.array(ServiceItemDraftSchema).default([]),
  prepostos: z.array(PrepostoDraftSchema).default([]),
});

// -----------------------------------------------------------------------------
// Financial / general
// -----------------------------------------------------------------------------

export const RefundBankAccountDraftSchema = z.object({
  id: optionalId,
  bankName: optionalTrimmedString,
  branch: optionalTrimmedString,
  account: optionalTrimmedString,
});

export const FinancialDraftSchema = z
  .object({
    id: optionalId,
    paymentPreference: PaymentPreferenceSchema.optional().nullable(),
    refundPixKey: optionalTrimmedString,
    refundBankAccounts: z.array(RefundBankAccountDraftSchema).default([]),
    notes: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (value.paymentPreference === "PIX" && !value.refundPixKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refundPixKey"],
        message: "Chave PIX é obrigatória",
      });
    }

    if (
      value.paymentPreference === "BANK_TRANSFER" &&
      value.refundBankAccounts.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refundBankAccounts"],
        message: "Informe ao menos uma conta bancária",
      });
    }
  });

export const GeneralDraftSchema = z.object({
  id: optionalId,
  description: optionalTrimmedString,
});

// -----------------------------------------------------------------------------
// Schema principal
// -----------------------------------------------------------------------------

export const ScopeDraftCanonicalSchema = z
  .object({
    company: CompanyDraftSchema,
    contacts: z.array(ContactDraftSchema).min(1, "Informe ao menos um contato"),
    assignments: AssignmentsDraftSchema,
    operations: OperationsDraftSchema,
    taxes: TaxesDraftSchema,
    services: ServicesDraftSchema,
    financial: FinancialDraftSchema,
    general: GeneralDraftSchema,
  })
  .superRefine((value, ctx) => {
    const hasImport = value.operations.types.includes("IMPORT");
    const hasExport = value.operations.types.includes("EXPORT");

    if (hasImport && value.assignments.importDaAnalystIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments", "importDaAnalystIds"],
        message: "Analista DA de importação é obrigatório",
      });
    }

    if (hasExport && value.assignments.exportDaAnalystIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments", "exportDaAnalystIds"],
        message: "Analista DA de exportação é obrigatório",
      });
    }

    if (hasImport && !value.taxes.importTaxes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxes", "importTaxes"],
        message: "Impostos de importação são obrigatórios",
      });
    }

    const enabledImportServices = value.services.items.filter(
      (service) => service.enabled && service.operationType === "IMPORT",
    );

    const enabledExportServices = value.services.items.filter(
      (service) => service.enabled && service.operationType === "EXPORT",
    );

    if (hasImport && enabledImportServices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["services", "items"],
        message: "Informe ao menos um serviço de importação contratado",
      });
    }

    if (hasExport && enabledExportServices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["services", "items"],
        message: "Informe ao menos um serviço de exportação contratado",
      });
    }
  });



// -----------------------------------------------------------------------------
// Schemas por etapa do wizard
// -----------------------------------------------------------------------------
// Use estes schemas no botão "Próximo". Eles validam apenas o step atual.
// O schema completo ScopeDraftCanonicalSchema deve ficar reservado para publicar.

export const ScopeStepCompanySchema = z
  .object({
    company: CompanyDraftSchema,
    assignments: z
      .object({
        commercialResponsibleId: requiredUuid("Responsável comercial é obrigatório"),
      })
      .passthrough(),
  })
  .passthrough();

export const ScopeStepContactsSchema = z
  .object({
    contacts: z.array(ContactDraftSchema).min(1, "Informe ao menos um contato"),
  })
  .passthrough();

export const ScopeStepOperationTypesSchema = z
  .object({
    operations: z
      .object({
        types: z.array(OperationTypeSchema).min(1, "Selecione ao menos uma operação"),
      })
      .passthrough(),
  })
  .passthrough();

export const ScopeStepImportOperationSchema = z
  .object({
    assignments: z
      .object({
        importDaAnalystIds: z
          .array(requiredUuid("Analista DA de importação é obrigatório"))
          .min(1, "Analista DA de importação é obrigatório"),
        importAeAnalystIds: z.array(requiredUuid("Analista AE de importação é obrigatório")).default([]),
      })
      .passthrough(),
    operations: z
      .object({
        importOperation: OperationDraftSchema,
      })
      .passthrough(),
  })
  .passthrough();

export const ScopeStepExportOperationSchema = z
  .object({
    assignments: z
      .object({
        exportDaAnalystIds: z
          .array(requiredUuid("Analista DA de exportação é obrigatório"))
          .min(1, "Analista DA de exportação é obrigatório"),
        exportAeAnalystIds: z.array(requiredUuid("Analista AE de exportação é obrigatório")).default([]),
      })
      .passthrough(),
    operations: z
      .object({
        exportOperation: OperationDraftSchema,
      })
      .passthrough(),
  })
  .passthrough();

export const ScopeStepTaxesSchema = z
  .object({
    operations: z
      .object({
        types: z.array(OperationTypeSchema).default([]),
      })
      .passthrough(),
    taxes: TaxesDraftSchema,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (value.operations.types.includes("IMPORT") && !value.taxes.importTaxes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxes", "importTaxes"],
        message: "Impostos de importação são obrigatórios",
      });
    }
  });

export const ScopeStepServicesSchema = z
  .object({
    operations: z
      .object({
        types: z.array(OperationTypeSchema).default([]),
      })
      .passthrough(),
    services: ServicesDraftSchema,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const hasImport = value.operations.types.includes("IMPORT");
    const hasExport = value.operations.types.includes("EXPORT");

    const enabledImportServices = value.services.items.filter(
      (service) => service.enabled && service.operationType === "IMPORT",
    );

    const enabledExportServices = value.services.items.filter(
      (service) => service.enabled && service.operationType === "EXPORT",
    );

    if (hasImport && enabledImportServices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["services", "items"],
        message: "Informe ao menos um serviço de importação contratado",
      });
    }

    if (hasExport && enabledExportServices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["services", "items"],
        message: "Informe ao menos um serviço de exportação contratado",
      });
    }
  });

export const ScopeStepFinancialSchema = z
  .object({
    financial: FinancialDraftSchema,
  })
  .passthrough();

export type ScopeDraftCanonical = z.infer<typeof ScopeDraftCanonicalSchema>;

export type CompanyDraft = z.infer<typeof CompanyDraftSchema>;
export type ContactDraft = z.infer<typeof ContactDraftSchema>;
export type AssignmentsDraft = z.infer<typeof AssignmentsDraftSchema>;
export type OperationDraft = z.infer<typeof OperationDraftSchema>;
export type OperationsDraft = z.infer<typeof OperationsDraftSchema>;
export type TaxesDraft = z.infer<typeof TaxesDraftSchema>;
export type ServicesDraft = z.infer<typeof ServicesDraftSchema>;
export type FinancialDraft = z.infer<typeof FinancialDraftSchema>;
export type GeneralDraft = z.infer<typeof GeneralDraftSchema>;

// Alias temporário para reduzir impacto nos imports antigos.
// Recomendo migrar os imports do projeto para ScopeDraftCanonicalSchema.
export const EscopoSchema = ScopeDraftCanonicalSchema;
export type EscopoForm = ScopeDraftCanonical;
