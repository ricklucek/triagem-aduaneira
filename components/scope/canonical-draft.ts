import type { ServicesDraft } from "@/domain/scope/schema";
import type { EscopoForm } from "@/domain/scope/types";

export type OperationType = "IMPORT" | "EXPORT";
export type ServiceType =
  | "CUSTOMS_CLEARANCE"
  | "LI_LPCO_ISSUANCE"
  | "PRODUCT_CATALOG_REGISTRATION"
  | "CONSULTING"
  | "INTERNATIONAL_FREIGHT"
  | "INTERNATIONAL_INSURANCE"
  | "ROAD_FREIGHT"
  | "NFE_ISSUANCE"
  | "ORIGIN_CERTIFICATE"
  | "PHYTOSANITARY_CERTIFICATE"
  | "OTHER_CERTIFICATE"
  | "SPECIAL_REGIME"
  | "OTHER";

export const OPERATION_LABEL: Record<OperationType, string> = {
  IMPORT: "Importação",
  EXPORT: "Exportação",
};

export const SERVICE_LABEL: Record<string, string> = {
  CUSTOMS_CLEARANCE: "Despacho aduaneiro",
  LI_LPCO_ISSUANCE: "Emissão LI/LPCO",
  PRODUCT_CATALOG_REGISTRATION: "Cadastro de catálogo de produtos",
  CONSULTING: "Assessoria",
  INTERNATIONAL_FREIGHT: "Frete internacional",
  INTERNATIONAL_INSURANCE: "Seguro internacional",
  ROAD_FREIGHT: "Frete rodoviário",
  NFE_ISSUANCE: "Emissão NF-e",
  ORIGIN_CERTIFICATE: "Certificado de origem",
  PHYTOSANITARY_CERTIFICATE: "Certificado fitossanitário",
  OTHER_CERTIFICATE: "Outros certificados",
  SPECIAL_REGIME: "Regime especial",
  OTHER: "Outro serviço",
};

export const DESTINATION_LABEL: Record<string, string> = {
  RESALE: "Revenda",
  INDUSTRIALIZATION: "Industrialização",
  USE_AND_CONSUMPTION: "Uso e consumo",
  FIXED_ASSET: "Ativo imobilizado",
  CONSUMPTION: "Consumo",
};

export const TAX_REGIME_LABEL: Record<string, string> = {
  FULL: "Integral",
  EXEMPTION: "Isenção",
  SUSPENSION: "Suspensão",
  REDUCTION: "Redução",
  OTHER: "Outro",
};

export const PRICING_LABEL: Record<string, string> = {
  FIXED: "Valor fixo",
  PERCENTAGE: "Percentual",
  MINIMUM_AMOUNT: "Valor mínimo",
  SALARY_BASED: "Salário mínimo",
  CASE_BY_CASE: "Caso a caso",
  INCLUDED: "Incluso",
  OTHER: "Outro",
};

export function emptyCanonicalDraft(): EscopoForm {
  return {
    company: {
      taxId: "",
      legalName: "",
      tradeName: null,
      stateRegistration: null,
      municipalRegistration: null,
      officeAddress: "",
      warehouseAddress: null,
      mainCnae: "",
      secondaryCnae: null,
      taxRegime: "SIMPLES_NACIONAL",
      radarMode: "RADAR_INATIVO",
    },
    contacts: [emptyContact(true)],
    assignments: {
      commercialResponsibleId: "",
      importDaAnalystIds: [],
      importAeAnalystIds: [],
      exportDaAnalystIds: [],
      exportAeAnalystIds: [],
    },
    operations: {
      types: [],
      importOperation: null,
      exportOperation: null,
    },
    taxes: {
      importTaxes: emptyOperationTaxes(),
      exportTaxes: null,
    },
    services: {
      items: [],
      prepostos: [],
    },
    financial: {
      paymentPreference: "BANK_TRANSFER",
      refundPixKey: null,
      refundBankAccounts: [emptyRefundBankAccount()],
      notes: null,
    },
    general: {
      description: null,
    },
  } as EscopoForm;
}

export function normalizeCanonicalDraft(value?: Partial<EscopoForm> | null): EscopoForm {
  const base = emptyCanonicalDraft();
  const incoming = value ?? {};
  return deepMerge(base, incoming) as EscopoForm;
}

export function emptyContact(primary = false) {
  return {
    name: "",
    departmentRole: "",
    email: "",
    phone: "",
    whatsapp: null,
    primary,
    active: true,
  };
}

export function emptyRefundBankAccount() {
  return {
    bankName: null,
    branch: null,
    account: null,
  };
}

export function emptyOperation(operationType: OperationType) {
  return {
    operationType,
    productsDescription: "",
    ncmNotes: null,
    hasExporterRelationship: operationType === "IMPORT" ? null : null,
    requiresDtc: operationType === "IMPORT" ? null : null,
    requiresDta: operationType === "IMPORT" ? null : null,
    requiresLiLpco: operationType === "IMPORT" ? null : null,
    otherAuthority: null,
    ncms: [],
    entryLocations: [],
    customsClearanceLocations: [],
    authorities: [],
    destinationPurposes: [],
  };
}

export function emptyOperationTaxes() {
  return {
    federalTaxes: {
      paymentAccountType: "CASCO",
      bankName: null,
      bankBranch: null,
      bankAccount: null,
      iiRegime: "FULL",
      iiBenefitDetail: null,
      ipiRegime: "FULL",
      ipiBenefitDetail: null,
      pisRegime: "FULL",
      pisBenefitDetail: null,
      cofinsRegime: "FULL",
      cofinsBenefitDetail: null,
      notes: null,
    },
    afrmm: {
      paymentAccountType: "CASCO",
      bankName: null,
      bankBranch: null,
      bankAccount: null,
      regime: "FULL",
      benefitDetail: null,
      notes: null,
    },
    icms: {
      paymentAccountType: "CASCO",
      bankName: null,
      bankBranch: null,
      bankAccount: null,
      regime: "FULL",
      collectedRate: null,
      effectiveRate: null,
      notes: null,
      destinationRates: [
        { destinationPurpose: "RESALE", collectedRate: null, effectiveRate: null, notes: null },
        { destinationPurpose: "INDUSTRIALIZATION", collectedRate: null, effectiveRate: null, notes: null },
        { destinationPurpose: "USE_AND_CONSUMPTION", collectedRate: null, effectiveRate: null, notes: null },
        { destinationPurpose: "FIXED_ASSET", collectedRate: null, effectiveRate: null, notes: null },
        { destinationPurpose: "CONSUMPTION", collectedRate: null, effectiveRate: null, notes: null },
      ],
    },
  };
}

export function buildServiceItem(serviceType: ServiceType, operationType: OperationType): ServicesDraft["items"][number] {
  const base: ServicesDraft["items"][number] = {
    catalogId: null,
    code: null,
    serviceType,
    operationType,
    enabled: false,
    pricingType: defaultPricingType(serviceType),
    amount: null,
    currency: "BRL",
    responsibleUserId: null,
    lastUpdatedOn: null,
    notes: null,
    details: null,
  };

  if (serviceType === "CUSTOMS_CLEARANCE" || serviceType === "CONSULTING") {
    base.pricingType = "SALARY_BASED";
    base.details = {
      type: "CUSTOMS_BROKER",
      pricingReference: "SALARIO_MINIMO",
      salaryMultiplier: null,
    };
  }

  if (serviceType === "INTERNATIONAL_FREIGHT" || serviceType === "ROAD_FREIGHT") {
    base.pricingType = "CASE_BY_CASE";
    base.details = {
      type: "FREIGHT",
      mode: "CASE_BY_CASE",
      negotiatedPtax: null,
      generalNotes: null,
    };
  }

  if (serviceType === "INTERNATIONAL_INSURANCE") {
    base.pricingType = "PERCENTAGE";
    base.details = {
      type: "INSURANCE",
      minimumAmount: null,
      cfrPercentage: null,
      policyInclusionDate: null,
      additionalDescription: null,
    };
  }

  if (["ORIGIN_CERTIFICATE", "PHYTOSANITARY_CERTIFICATE", "OTHER_CERTIFICATE"].includes(serviceType)) {
    base.pricingType = "FIXED";
    base.details = {
      type: "CERTIFICATE",
      certificateName: SERVICE_LABEL[serviceType],
      issuingAuthority: null,
      notes: null,
    };
  }

  if (serviceType === "SPECIAL_REGIME") {
    base.pricingType = "FIXED";
    base.details = {
      type: "SPECIAL_REGIME",
      regimes: [],
    };
  }

  return base;
}

export function buildPreposto(operationType: OperationType) {
  return {
    operationType,
    enabled: false,
    prepostoId: null,
    prepostoName: null,
    manualPrepostoName: null,
    manualPrepostoNotes: null,
    origin: "MANUAL" as "API" | "MANUAL",
    amount: null,
    includedInCascoCustomsClearance: null,
    otherPort: null,
    otherBorder: null,
    notes: null,
    cities: [],
  };
}

function defaultPricingType(serviceType: ServiceType) {
  if (["LI_LPCO_ISSUANCE", "PRODUCT_CATALOG_REGISTRATION", "NFE_ISSUANCE"].includes(serviceType)) {
    return "FIXED";
  }
  return "CASE_BY_CASE";
}

export function deepMerge<T>(base: T, incoming: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(incoming)) return (incoming ?? base) as T;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
    const current = result[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = deepMerge(current, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function splitLines(value: string) {
  return value
    .split(/[\n;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinLines(values?: Array<string | null | undefined>) {
  return (values ?? []).filter(Boolean).join("\n");
}

export function responsibleName(user?: { name?: string | null; nome?: string | null } | null) {
  return user?.name ?? user?.nome ?? "";
}

export function responsibleDepartment(user?: { department?: string | null; setor?: string | null } | null) {
  return user?.department ?? user?.setor ?? "";
}
