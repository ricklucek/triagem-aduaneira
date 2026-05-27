import type { ScopeDraftCanonical } from "./schema";

export type EscopoForm = ScopeDraftCanonical;

export type EtapaFormulario =
  | "COMPANY"
  | "CONTACTS"
  | "OPERATIONS"
  | "IMPORT"
  | "EXPORT"
  | "TAXES"
  | "SERVICES"
  | "FINANCIAL";
