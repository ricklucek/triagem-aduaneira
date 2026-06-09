import { z } from "zod";

export const TRACKER_PROCESS_STEPS = [
  "IDENTIFICATION",
  "OPERATION",
  "SCOPE",
] as const;

export type TrackerProcessStep = (typeof TRACKER_PROCESS_STEPS)[number];

export const operationTypeOptions = [
  { id: "IMPORTACAO", label: "Importação" },
  { id: "EXPORTACAO", label: "Exportação" },
] as const;

export const modalOptions = [
  { value: "MARITIMO", label: "Marítimo" },
  { value: "AEREO", label: "Aéreo" },
  { value: "RODOVIARIO", label: "Rodoviário" },
] as const;

export const maritimeSubtypeOptions = [
  { value: "LCL", label: "LCL" },
  { value: "FCL", label: "FCL" },
] as const;

export const purposeOptions = [
  { value: "CONSUMO", label: "Consumo" },
  { value: "REVENDA", label: "Revenda" },
  { value: "ADMISSAO_TEMPORARIA", label: "Admissão temporária" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const consumptionSubtypeOptions = [
  { value: "ATIVO_IMOBILIZADO_FIXO", label: "Ativo imobilizado / Fixo" },
  { value: "INDUSTRIALIZACAO", label: "Industrialização" },
  { value: "USO_E_CONSUMO", label: "Uso e consumo" },
] as const;

export const responsibleOptions = [
  { value: "CASCO", label: "Casco" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "TERCEIRO", label: "Terceiro" },
] as const;

export const quoteStatusOptions = [
  { value: "APROVADA", label: "Aprovada" },
  { value: "REPROVADA", label: "Reprovada" },
] as const;

export const yesNoOptions = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
] as const;

export const yesNoConfirmOptions = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
  { value: "A_CONFIRMAR", label: "A confirmar" },
] as const;

export const insuranceOptions = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
  { value: "CASO_A_CASO", label: "Caso a caso" },
] as const;

export const specialRegimeOptions = [
  { value: "NACIONALIZACAO", label: "Nacionalização" },
  { value: "RESTITUICAO", label: "Restituição" },
  { value: "EX_TARIFARIO", label: "EX Tarifário" },
] as const;

export const consentingAgencyOptions = [
  { id: "ANVISA", label: "ANVISA" },
  { id: "MAPA", label: "MAPA" },
  { id: "IBAMA", label: "IBAMA" },
  { id: "DFPC", label: "DFPC" },
  { id: "DPF", label: "DPF" },
  { id: "MARINHA_AERONAUTICA", label: "Marinha e Aeronáutica" },
  { id: "CTMSP_CNEN", label: "CTMSP/CNEN" },
  { id: "MDIC_SECEX", label: "MDIC/SECEX" },
  { id: "BACEN", label: "BACEN" },
  { id: "RFB", label: "RFB" },
  { id: "INMETRO", label: "INMETRO" },
  { id: "CNPQ_MCTI", label: "CNPq/MCTI" },
  { id: "ICMBIO", label: "ICMBio" },
  { id: "ANP", label: "ANP" },
  { id: "ANTT_ANTAQ_ANAC", label: "ANTT/ANTAQ/ANAC" },
] as const;

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(
  blankToUndefined,
  z.string().trim().optional(),
);
const dateText = z
  .preprocess(blankToUndefined, z.string().trim().optional())
  .refine((value) => !value || /^\d{2}\/\d{2}\/\d{4}$/.test(value), {
    message: "Use o formato DD/MM/AAAA",
  });

export const trackerIdentificationSchema = z.object({
  client: z.object({
    id: z.string().trim().min(1, "Selecione um cliente"),
    name: z.string().trim().min(1, "Cliente inválido"),
    taxId: optionalText,
  }),
  internalReference: optionalText,
  clientReference: optionalText,
});

export const trackerOperationSchema = z
  .object({
    operationTypes: z.array(z.enum(["IMPORTACAO", "EXPORTACAO"])).default([]),
    incoterm: optionalText,
    modal: z.enum(["MARITIMO", "AEREO", "RODOVIARIO", ""]).default(""),
    maritimeSubtype: z.enum(["LCL", "FCL", ""]).default(""),
    etd: dateText,
    eta: dateText,
    importer: optionalText,
    exporter: optionalText,
    purpose: z
      .enum(["CONSUMO", "REVENDA", "ADMISSAO_TEMPORARIA", "OUTRO", ""])
      .default(""),
    purposeDescription: optionalText,
    consumptionSubtype: z
      .enum(["ATIVO_IMOBILIZADO_FIXO", "INDUSTRIALIZACAO", "USO_E_CONSUMO", ""])
      .default(""),
  })
  .superRefine((value, ctx) => {
    if (value.modal === "MARITIMO" && !value.maritimeSubtype) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maritimeSubtype"],
        message: "Selecione o subtipo marítimo",
      });
    }

    if (value.purpose === "OUTRO" && !value.purposeDescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purposeDescription"],
        message: "Descreva a finalidade",
      });
    }

    if (value.purpose === "CONSUMO" && !value.consumptionSubtype) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consumptionSubtype"],
        message: "Selecione o tipo de consumo",
      });
    }
  });

const serviceContractSchema = z
  .object({
    responsibleType: z.enum(["CASCO", "CLIENTE", "TERCEIRO", ""]).default(""),
    responsibleName: optionalText,
  })
  .superRefine((value, ctx) => {
    if (
      (value.responsibleType === "CASCO" ||
        value.responsibleType === "TERCEIRO") &&
      !value.responsibleName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsibleName"],
        message: "Informe o nome do responsável",
      });
    }
  });

const roadFreightSchema = serviceContractSchema.extend({
  quoteStatus: z.enum(["APROVADA", "REPROVADA", ""]).default(""),
});

const insuranceSchema = z
  .object({
    option: z.enum(["SIM", "NAO", "CASO_A_CASO", ""]).default(""),
    responsibleName: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.option === "SIM" && !value.responsibleName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsibleName"],
        message: "Informe o nome do responsável",
      });
    }
  });

export const trackerScopeSchema = z
  .object({
    contractedServices: z.object({
      customsClearance: serviceContractSchema,
      advisory: serviceContractSchema,
      roadFreight: roadFreightSchema,
      internationalFreight: serviceContractSchema,
      internationalInsurance: insuranceSchema,
    }),
    specialRegime: z.enum(["SIM", "NAO", ""]).default(""),
    specialRegimeType: z
      .enum(["NACIONALIZACAO", "RESTITUICAO", "EX_TARIFARIO", ""])
      .default(""),
    drawback: z.enum(["SIM", "NAO", ""]).default(""),
    dta: z.enum(["SIM", "NAO", ""]).default(""),
    dtaDestination: optionalText,
    dtc: z.enum(["SIM", "NAO", ""]).default(""),
    dtcDestination: optionalText,
    li: z.enum(["SIM", "NAO", "A_CONFIRMAR", ""]).default(""),
    consentingAgencies: z.array(z.string()).default([]),
    dangerousCargo: z.enum(["SIM", "NAO", "A_CONFIRMAR", ""]).default(""),
    dangerousCargoDescription: optionalText,
    exTariff: z.enum(["SIM", "NAO", "A_CONFIRMAR", ""]).default(""),
  })
  .superRefine((value, ctx) => {
    if (value.specialRegime === "SIM" && !value.specialRegimeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specialRegimeType"],
        message: "Selecione o tipo de regime especial",
      });
    }

    if (value.dta === "SIM" && !value.dtaDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dtaDestination"],
        message: "Informe o destino DTA",
      });
    }

    if (value.dtc === "SIM" && !value.dtcDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dtcDestination"],
        message: "Informe o destino DTC",
      });
    }

    if (value.li === "SIM" && value.consentingAgencies.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consentingAgencies"],
        message: "Selecione ao menos um órgão anuente",
      });
    }

    if (value.dangerousCargo === "SIM" && !value.dangerousCargoDescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dangerousCargoDescription"],
        message: "Descreva o tipo de carga perigosa",
      });
    }
  });

export const trackerProcessFormSchema = z.object({
  identification: trackerIdentificationSchema,
  operation: trackerOperationSchema,
  scope: trackerScopeSchema,
});

export type TrackerProcessForm = z.infer<typeof trackerProcessFormSchema>;

export const defaultTrackerProcessForm: TrackerProcessForm = {
  identification: {
    client: { id: "", name: "", taxId: "" },
    internalReference: "",
    clientReference: "",
  },
  operation: {
    operationTypes: [],
    incoterm: "",
    modal: "",
    maritimeSubtype: "",
    etd: "",
    eta: "",
    importer: "",
    exporter: "",
    purpose: "",
    purposeDescription: "",
    consumptionSubtype: "",
  },
  scope: {
    contractedServices: {
      customsClearance: { responsibleType: "", responsibleName: "" },
      advisory: { responsibleType: "", responsibleName: "" },
      roadFreight: {
        responsibleType: "",
        responsibleName: "",
        quoteStatus: "",
      },
      internationalFreight: { responsibleType: "", responsibleName: "" },
      internationalInsurance: { option: "", responsibleName: "" },
    },
    specialRegime: "",
    specialRegimeType: "",
    drawback: "",
    dta: "",
    dtaDestination: "",
    dtc: "",
    dtcDestination: "",
    li: "",
    consentingAgencies: [],
    dangerousCargo: "",
    dangerousCargoDescription: "",
    exTariff: "",
  },
};

export function validateTrackerStep(
  step: TrackerProcessStep,
  data: TrackerProcessForm,
) {
  const schemaByStep = {
    IDENTIFICATION: trackerIdentificationSchema,
    OPERATION: trackerOperationSchema,
    SCOPE: trackerScopeSchema,
  } as const;

  const valueByStep = {
    IDENTIFICATION: data.identification,
    OPERATION: data.operation,
    SCOPE: data.scope,
  } as const;

  const result = schemaByStep[step].safeParse(valueByStep[step]);

  if (result.success) return { ok: true, errors: {} } as const;

  return {
    ok: false,
    errors: Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    ),
  } as const;
}

export function validateTrackerForm(data: TrackerProcessForm) {
  const result = trackerProcessFormSchema.safeParse(data);

  if (result.success) return { ok: true, errors: {} } as const;

  return {
    ok: false,
    errors: Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    ),
  } as const;
}
