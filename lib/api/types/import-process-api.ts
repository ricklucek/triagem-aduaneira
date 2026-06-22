export type ImportProcessStage =
  | "pre_shipment"
  | "shipment_in_transit"
  | "customs_clearance"
  | "released_for_delivery";

export type ImportProcessTagType = "dta" | "dtc" | "li_lpco";

export type ImportProcessServiceType =
  | "customs_clearance"
  | "international_freight"
  | "international_insurance"
  | "road_freight"
  | "advisory"
  | "financial";

export type ImportProcessServiceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ImportProcessTaskStatus = "pending" | "active" | "done" | "blocked";

export type InternationalFreightResponsibility =
  | "internal"
  | "client"
  | "third_party"
  | "not_applicable";

export type FreightQuoteStatus =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type ImportProcessServiceResponsibility =
  | "internal"
  | "client"
  | "third_party"
  | "not_applicable";

export interface ImportProcessClientApi {
  id: string;
  razao_social?: string | null;
  nome_resumido?: string | null;
  cnpj?: string | null;
  tax_id?: string | null;
}

export interface ImportProcessShipmentApi {
  id: number;
  import_process_id: number;

  estimated_departure_at?: string | null;
  estimated_arrival_at?: string | null;

  actual_departure_at?: string | null;
  actual_arrival_at?: string | null;

  origin?: string | null;
  destination?: string | null;

  vessel_name?: string | null;
  voyage_number?: string | null;

  master_bl?: string | null;
  house_bl?: string | null;

  container_number?: string | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessFreightApi {
  id: number;
  import_process_id: number;

  international_freight_responsibility: InternationalFreightResponsibility;
  quote_status: FreightQuoteStatus;

  quote_requested_at?: string | null;
  quote_approved_at?: string | null;
  quote_rejected_at?: string | null;

  provider_name?: string | null;

  quoted_amount?: string | number | null;
  quoted_currency?: string | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessServiceApi {
  id: number;
  import_process_id: number;

  service_type: ImportProcessServiceType;

  responsibility: ImportProcessServiceResponsibility;
  responsible_name?: string | null;

  status: ImportProcessServiceStatus;

  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessTaskChecklistItemApi {
  id: number;
  task_id: number;

  item_key: string;
  label: string;

  status: ImportProcessTaskStatus;

  required: boolean;
  position: number;

  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessTaskApi {
  id: number;
  import_process_id: number;

  stage: ImportProcessStage;
  service_type: ImportProcessServiceType;
  task_key: string;

  name: string;
  description?: string | null;

  status: ImportProcessTaskStatus;

  position: number;

  due_date?: string | null;

  started_at?: string | null;
  completed_at?: string | null;
  blocked_at?: string | null;

  blocking_reason?: string | null;

  assigned_to_user_id?: string | number | null;

  checklist_items: ImportProcessTaskChecklistItemApi[];

  created_at?: string;
  updated_at?: string;
}

export interface ImportProcessTagApi {
  id: number;
  import_process_id: number;

  tag_type: ImportProcessTagType;

  created_at?: string;
}

export interface ImportProcessApi {
  id: number;

  process_number: string;

  internal_reference?: string | null;
  client_reference?: string | null;

  client_id: string;

  opened_at: string;

  current_stage: ImportProcessStage;

  metadata_json?: Record<string, unknown> | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;

  client?: ImportProcessClientApi | null;

  shipments: ImportProcessShipmentApi[];

  freight?: ImportProcessFreightApi | null;

  services: ImportProcessServiceApi[];

  tasks: ImportProcessTaskApi[];

  tags: ImportProcessTagApi[];
}

export interface CreateImportProcessShipmentPayload {
  estimated_departure_at?: string | null;
  estimated_arrival_at?: string | null;

  actual_departure_at?: string | null;
  actual_arrival_at?: string | null;

  origin?: string | null;
  destination?: string | null;

  vessel_name?: string | null;
  voyage_number?: string | null;

  master_bl?: string | null;
  house_bl?: string | null;

  container_number?: string | null;

  notes?: string | null;
}

export interface CreateImportProcessFreightPayload {
  international_freight_responsibility: InternationalFreightResponsibility;
  quote_status: FreightQuoteStatus;

  quote_requested_at?: string | null;
  quote_approved_at?: string | null;
  quote_rejected_at?: string | null;

  provider_name?: string | null;

  quoted_amount?: string | number | null;
  quoted_currency?: string | null;

  notes?: string | null;
}

export interface CreateImportProcessServicePayload {
  service_type: ImportProcessServiceType;

  responsibility?: ImportProcessServiceResponsibility;
  responsible_name?: string | null;

  status?: ImportProcessServiceStatus;

  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;

  notes?: string | null;
}

export interface CreateImportProcessTagPayload {
  tag_type: ImportProcessTagType;
}

export interface CreateImportProcessPayload {
  process_number: string;

  internal_reference?: string | null;
  client_reference?: string | null;

  client_id: string;

  opened_at: string;

  current_stage?: ImportProcessStage;

  metadata_json?: Record<string, unknown> | null;

  notes?: string | null;

  shipment?: CreateImportProcessShipmentPayload | null;

  freight?: CreateImportProcessFreightPayload | null;

  services?: CreateImportProcessServicePayload[];

  tags?: CreateImportProcessTagPayload[];
}

export interface UpdateImportProcessPayload {
  process_number?: string;

  internal_reference?: string | null;
  client_reference?: string | null;

  client_id?: string;

  opened_at?: string;

  current_stage?: ImportProcessStage;

  metadata_json?: Record<string, unknown> | null;

  notes?: string | null;
}

export interface UpdateImportProcessStagePayload {
  current_stage: ImportProcessStage;
}

export interface UpdateImportProcessTaskPayload {
  service_type?: ImportProcessServiceType;
  stage?: ImportProcessStage;

  name?: string;
  description?: string | null;

  status?: ImportProcessTaskStatus;

  position?: number;

  due_date?: string | null;

  started_at?: string | null;
  completed_at?: string | null;
  blocked_at?: string | null;

  blocking_reason?: string | null;

  assigned_to_user_id?: string | number | null;
}

export interface ListImportProcessesParams {
  search?: string;
  stage?: ImportProcessStage;
  clientId?: string;
  tag?: ImportProcessTagType;
  limit?: number;
  offset?: number;
}

export interface DepartmentBoardProcessesParams {
  search?: string;
  includeCompleted?: boolean;
  tag?: ImportProcessTagType;
  limit?: number;
  offset?: number;
}

export interface ImportProcessesResponse {
  items: ImportProcessApi[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateImportProcessTaskChecklistItemPayload {
  status?: ImportProcessTaskStatus;
}

export interface UpdateImportProcessTaskChecklistItemPayload {
  label?: string;
  status?: ImportProcessTaskStatus;
  required?: boolean;
  position?: number;
}
