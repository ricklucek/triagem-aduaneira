export type ImportProcessStage =
  | "pre_shipment"
  | "shipment_in_transit"
  | "customs_clearance"
  | "released_for_delivery";

export type ImportProcessTagType = "dta" | "dtc" | "li_lpco";

export type ServiceType =
  | "customs_clearance"
  | "international_freight"
  | "international_insurance"
  | "road_freight"
  | "advisory"
  | "financial";

export type ServiceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskStatus = "pending" | "active" | "done" | "blocked";

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

export interface ImportProcessClient {
  id: string;
  name: string;
  taxId?: string;
}

export interface ImportProcessDates {
  openedAt: string;
  estimatedDepartureAt?: string;
  estimatedArrivalAt?: string;
  actualDepartureAt?: string;
  actualArrivalAt?: string;
}

export interface ImportProcessShipment {
  id?: string;
  origin?: string;
  destination?: string;
  estimatedDepartureAt?: string;
  estimatedArrivalAt?: string;
  actualDepartureAt?: string;
  actualArrivalAt?: string;
  vesselName?: string;
  masterBl?: string;
  houseBl?: string;
}

export interface ImportProcessFreight {
  internationalFreightResponsibility: InternationalFreightResponsibility;
  quoteStatus: FreightQuoteStatus;
  quoteApprovedAt?: string;
  providerName?: string;
  notes?: string;
}

export interface ImportProcessService {
  id: string;
  type: ServiceType;
  status: ServiceStatus;
}

export interface ImportProcessTask {
  id: string;
  name: string;
  status: TaskStatus;
  serviceType: ServiceType;
  position?: number;
  dueDate?: string;
  completedAt?: string;
}

export interface ImportProcess {
  id: string;
  processNumber: string;
  internalReference?: string;
  clientReference?: string;
  client: ImportProcessClient;
  dates: ImportProcessDates;
  shipment?: ImportProcessShipment;
  freight: ImportProcessFreight;
  services: ImportProcessService[];
  currentStage: ImportProcessStage;
  tags: ImportProcessTagType[];
  tasks: ImportProcessTask[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ListImportProcessesParams {
  search?: string;
  stage?: ImportProcessStage;
  clientId?: string;
  tag?: ImportProcessTagType;
}

export type ImportProcessesResponse =
  {
    items: ImportProcess[],
    total: number,
    limit: number,
    offset: number,
  }


