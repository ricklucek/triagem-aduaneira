import {
  EscopoSchema,
  ScopeStepCompanySchema,
  ScopeStepContactsSchema,
  ScopeStepOperationTypesSchema,
  ScopeStepImportOperationSchema,
  ScopeStepExportOperationSchema,
  ScopeStepTaxesSchema,
  ScopeStepServicesSchema,
  ScopeStepFinancialSchema,
} from "./schema";
import type { EscopoForm, EtapaFormulario } from "./types";

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
};

export function zodErrorsToMap(error: any): Record<string, string> {
  const map: Record<string, string> = {};

  for (const issue of error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    if (!map[path]) map[path] = issue.message;
  }

  return map;
}

export function validarFormularioCompleto(data: EscopoForm): ValidationResult {
  const result = EscopoSchema.safeParse(data);

  if (result.success) {
    return { ok: true, errors: {} };
  }

  return { ok: false, errors: zodErrorsToMap(result.error) };
}

export function validarEtapa(etapa: EtapaFormulario, data: EscopoForm): ValidationResult {
  const schemas: Record<EtapaFormulario, { safeParse: (value: unknown) => any }> = {
    COMPANY: ScopeStepCompanySchema,
    CONTACTS: ScopeStepContactsSchema,
    OPERATIONS: ScopeStepOperationTypesSchema,
    IMPORT: ScopeStepImportOperationSchema,
    EXPORT: ScopeStepExportOperationSchema,
    TAXES: ScopeStepTaxesSchema,
    SERVICES: ScopeStepServicesSchema,
    FINANCIAL: ScopeStepFinancialSchema,
  };

  const result = schemas[etapa].safeParse(data);

  if (result.success) {
    return { ok: true, errors: {} };
  }

  return { ok: false, errors: zodErrorsToMap(result.error) };
}
