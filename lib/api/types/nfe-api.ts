export type FiscalEnvironment = "homologation" | "production";
export type ImportPurpose = "resale" | "industrialization" | "fixed_asset" | "use_consumption";

export interface ImportProcessSummary {
  id: string;
  importer_id: string;
  reference_code: string;
  duimp_number?: string | null;
  duimp_version?: string | null;
  status: string;
  source: string;
  created_by_user_id?: string | null;
  created_by_me: boolean;
  has_fiscal_profile: boolean;
  snapshots_count: number;
  latest_draft_id?: string | null;
  latest_draft_status?: string | null;
  items_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ListImportProcessesResponse {
  items: ImportProcessSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface FiscalProfilePayload {
  legal_name: string;
  trade_name?: string | null;
  cnpj: string;
  state_registration?: string | null;
  tax_regime: "1" | "2" | "3";
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city_code: string;
  city_name: string;
  state: string;
  zip_code: string;
  country_code?: string;
  country_name?: string;
  phone?: string | null;
  email?: string | null;
}

export interface ImportTaxRulePayload {
  name: string;
  issuer_state: string;
  import_purpose: ImportPurpose;
  import_modality?: "direct" | "on_behalf" | "by_order" | null;
  tax_regime?: "1" | "2" | "3" | null;
  priority?: number;
  effective_from?: string | null;
  configuration_json: Record<string, unknown>;
  transport_defaults?: Record<string, unknown> | null;
  payment_defaults?: Record<string, unknown> | null;
  active?: boolean;
}

export interface NfeNumberSequencePayload {
  environment: FiscalEnvironment;
  model: "55";
  series: string;
  current_number: number;
  initial_number: number;
  max_number: number;
  status: "active" | "inactive";
}

export interface NfeWorkflowState {
  process: ImportProcessSummary;
  latest_snapshot: null | {
    id: string;
    duimp_number: string;
    duimp_version?: string | null;
    fetched_at?: string | null;
  };
  context: null | {
    ready_for_draft: boolean;
    missing_fields: string[];
    warnings?: Array<Record<string, unknown>>;
    tax_rule?: { id: string; name: string } | null;
  };
  latest_draft: null | {
    draft: Record<string, unknown> & { id: string; status: string };
    items: Array<Record<string, unknown> & { id: string }>;
    xmlVersions: Array<Record<string, unknown> & { id: string; xsd_valid?: boolean | null }>;
  };
  prerequisites: {
    has_fiscal_profile: boolean;
    has_active_tax_rule: boolean;
    has_number_sequence: boolean;
    import_purpose?: ImportPurpose | null;
    environment: FiscalEnvironment;
    series: string;
  };
  next_action: string;
}
