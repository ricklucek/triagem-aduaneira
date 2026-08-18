export type FiscalEnvironment = "homologation" | "production";
export type ImportPurpose = "resale" | "industrialization" | "fixed_asset" | "use_consumption";

export interface ProviderConnectionSummary {
  id: string;
  importer_id?: string | null;
  provider: string;
  environment: FiscalEnvironment;
  status: string;
  credentials_ref?: string | null;
}

export interface ListProviderConnectionsResponse {
  items: ProviderConnectionSummary[];
  total: number;
  limit: number;
  offset: number;
}

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
  importer?: {
    id: string;
    name: string;
    legal_name: string;
    cnpj: string;
  };
  next_action?: string;
  pending?: boolean;
  planned_documents_count?: number;
  last_responsible?: {
    id: string;
    name: string;
    is_current_user: boolean;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ListImportProcessesResponse {
  items: ImportProcessSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImportProcessClientGroup {
  client_id: string;
  name: string;
  legal_name: string;
  cnpj: string;
  process_count: number;
  pending_count: number;
  last_updated_at?: string | null;
}

export interface ListImportProcessClientGroupsResponse {
  items: ImportProcessClientGroup[];
  total: number;
  limit: number;
  offset: number;
  q?: string | null;
  created_by_me: boolean;
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

export interface NfeXmlVersionSummary {
  id: string;
  version_number: number;
  xml_type: string;
  xsd_valid?: boolean | null;
  xsd_errors?: Array<Record<string, unknown>> | null;
  access_key?: string | null;
  protocol_number?: string | null;
  generated_at?: string | null;
}

export interface NfeXmlValidationResult {
  xml_version_id: string;
  nfe_draft_id: string;
  version_number: number;
  xml_type: string;
  valid: boolean;
  errors: Array<Record<string, unknown>>;
  xsd_valid: boolean;
  xsd_errors: Array<Record<string, unknown>>;
  schema?: {
    package?: string;
    file?: string;
  };
}

export interface NfeDraftSummary {
  id: string;
  status: string;
  environment: FiscalEnvironment;
  series: string;
  number?: number | null;
  access_key?: string | null;
  duimp_snapshot_id?: string | null;
  items_count: number;
  validation_errors: Array<Record<string, unknown>>;
  validation_warnings: Array<Record<string, unknown>>;
  created_at?: string | null;
  updated_at?: string | null;
  xml_versions: NfeXmlVersionSummary[];
}

export interface NfeDraftDetailResponse {
  draft: NfeDraftSummary & {
    fiscal_payload: Record<string, unknown>;
  };
  items: Array<Record<string, unknown> & { id: string }>;
  xmlVersions: NfeXmlVersionSummary[];
}

export interface UpdateNfeDraftPayload {
  document?: Record<string, unknown>;
  issuer?: {
    state_registration?: string;
  };
  foreign_supplier?: {
    legal_name?: string;
    foreign_id?: string | null;
    country_code?: string;
    country_name?: string;
    country_iso_alpha_2?: string;
    address?: Record<string, string>;
  };
  item_defaults?: Record<string, unknown>;
  transport?: {
    freight_mode?: string;
    carrier?: Record<string, string>;
    volume?: Record<string, string | number>;
  };
  payment?: Record<string, unknown>;
  additional_info?: Record<string, unknown>;
}

export interface DuimpSnapshotDetail {
  id: string;
  duimp_number: string;
  duimp_version?: string | null;
  source_provider?: string | null;
  fetched_at?: string | null;
  created_at?: string | null;
  raw_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
}

export interface NfeContextField {
  value?: unknown;
  source?: string | null;
  status?: string;
}

export interface NfeContextState {
  ready_for_draft: boolean;
  missing_fields: string[];
  warnings?: Array<Record<string, unknown>>;
  tax_rule?: { id: string; name: string } | null;
  fields?: Record<string, NfeContextField>;
  normalized?: Record<string, unknown>;
  suggested?: {
    duimp_overrides?: Record<string, unknown>;
    foreign_supplier?: Record<string, unknown> | null;
    additional_costs?: Record<string, unknown>;
  };
}

export interface ResolveNfeContextPayload {
  duimp_snapshot_id?: string;
  import_purpose: ImportPurpose;
  provider_environment?: FiscalEnvironment;
  refresh_external?: boolean;
  overrides: Record<string, unknown>;
}

export interface NfeItemClassificationItem {
  duimp_item_number: string;
  product_code?: string | null;
  description?: string | null;
  ncm?: string | null;
  exporter_code?: string | null;
  import_purpose?: ImportPurpose | null;
  cfop?: string | null;
  cfop_source?: "tax_rule" | "purpose_default" | null;
  tax_rule?: { id: string; name: string; active: boolean } | null;
  status: "unclassified" | "missing_tax_rule" | "inactive_tax_rule" | "missing_cfop" | "classified";
  classified_by?: { id: string; name: string } | null;
  updated_at?: string | null;
}

export interface NfeItemClassificationState {
  process_id: string;
  snapshot_id: string;
  items: NfeItemClassificationItem[];
  total_items: number;
  classified_count: number;
  pending_count: number;
  purpose_counts: Partial<Record<ImportPurpose, number>>;
  has_classifications: boolean;
  ready_for_draft: boolean;
  latest_updated_at?: string | null;
}

export interface NfeWorkflowState {
  process: ImportProcessSummary;
  latest_snapshot: null | {
    id: string;
    duimp_number: string;
    duimp_version?: string | null;
    fetched_at?: string | null;
  };
  context: NfeContextState | null;
  item_classification: NfeItemClassificationState | null;
  latest_draft: null | {
    draft: Record<string, unknown> & { id: string; status: string };
    items: Array<Record<string, unknown> & { id: string }>;
    xmlVersions: Array<Record<string, unknown> & { id: string; xsd_valid?: boolean | null }>;
  };
  prerequisites: {
    has_fiscal_profile: boolean;
    has_active_tax_rule: boolean;
    has_number_sequence: boolean;
    has_item_classification: boolean;
    item_classification_ready: boolean;
    import_purpose?: ImportPurpose | null;
    environment: FiscalEnvironment;
    series: string;
  };
  next_action: string;
}
