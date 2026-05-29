import type {
  ListScopesParams,
  ListScopesResult,
  PublishResult,
  ScopeVersion,
} from "@/data/scope/ScopeRepo";
import type { EscopoForm } from "@/domain/scope/types";
import type { ScopeMetadataResponse } from "@/lib/api/types/scope-metadata";
import { IUser } from "./auth-api";

export type ScopeStatus = "draft" | "published" | "archived";

export type OperationType = "IMPORT" | "EXPORT";
export type ServiceOperationType = "IMPORT" | "EXPORT" | "BOTH";

export type DestinationPurpose =
  | "RESALE"
  | "INDUSTRIALIZATION"
  | "USE_AND_CONSUMPTION"
  | "FIXED_ASSET"
  | "CONSUMPTION";

export type LocationType = "ENTRY" | "CUSTOMS_CLEARANCE";

export type AccountOwnerType = "CASCO" | "CLIENT";

export type TaxRegime =
  | "FULL"
  | "EXEMPTION"
  | "SUSPENSION"
  | "REDUCTION"
  | "OTHER";

export type PaymentPreference =
  | "BANK_TRANSFER"
  | "PIX"
  | "BANK_SLIP"
  | "OTHER";

export type PricingType =
  | "FIXED"
  | "PERCENTAGE"
  | "MINIMUM_AMOUNT"
  | "SALARY_BASED"
  | "CASE_BY_CASE"
  | "INCLUDED"
  | "OTHER";

export type ServiceType =
  | "CUSTOMS_CLEARANCE"
  | "PREPOSTO"
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

export type ServiceDetailType =
  | "FREIGHT"
  | "INSURANCE"
  | "CUSTOMS_BROKER"
  | "CERTIFICATE";

export interface ContactInfo {
  id: string;
  clientId?: string;
  client_id?: string;
  name: string;
  departmentRole?: string | null;
  department_role?: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  primary: boolean;
  active: boolean;
}

export interface CompanyInfo {
  id: string;
  organizationId: string;
  taxId: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  officeAddress: string | null;
  warehouseAddress: string | null;
  mainCnae: string | null;
  secondaryCnae: string | null;
  taxRegime: string | null;
  radarMode: string | null;
  active?: boolean;
  contacts?: ContactInfo[];
}

export interface Assignments {
  commercialResponsible: IUser | null;
  importDaAnalysts: IUser[];
  importAeAnalysts: IUser[];
  exportDaAnalysts: IUser[];
  exportAeAnalysts: IUser[];
}

export interface ScopeOperationNcm {
  id: string;
  code: string;
  description: string | null;
  hasBenefit?: boolean | null;
  benefitDescription?: string | null;
}

export interface ScopeOperationLocation {
  id: string;
  type: LocationType;
  code: string | null;
  name: string;
  rawValue: string | null;
}

export interface ScopeOperationAuthority {
  id: string;
  code: string | null;
  name: string;
}

export interface ScopeOperationDestinationPurpose {
  id: string;
  purpose: DestinationPurpose;
  consumptionSubtype: string | null;
  consumptionSubtypes?: string[];
}

export interface ScopeOperationDetail {
  id: string;
  operationType: OperationType;

  productsDescription: string | null;
  ncmNotes: string | null;

  hasExporterRelationship: boolean | null;
  requiresDtc: boolean | null;
  requiresDta: boolean | null;
  requiresLiLpco: boolean | null;

  otherAuthority: string | null;

  ncms: ScopeOperationNcm[];
  entryLocations: ScopeOperationLocation[];
  customsClearanceLocations: ScopeOperationLocation[];
  authorities: ScopeOperationAuthority[];
  destinationPurposes: ScopeOperationDestinationPurpose[];
}

export interface ScopeOperations {
  types: OperationType[];
  importOperation: ScopeOperationDetail | null;
  exportOperation: ScopeOperationDetail | null;
}

export interface FederalTaxProfile {
  id: string;
  paymentAccountType: AccountOwnerType;
  bankName: string | null;
  bankBranch: string | null;
  bankAccount: string | null;

  iiRegime: TaxRegime | null;
  iiBenefitDetail: string | null;
  ipiRegime: TaxRegime | null;
  ipiBenefitDetail: string | null;
  pisRegime: TaxRegime | null;
  pisBenefitDetail: string | null;
  cofinsRegime: TaxRegime | null;
  cofinsBenefitDetail: string | null;

  notes: string | null;
}

export interface AfrmmProfile {
  id: string;
  paymentAccountType: AccountOwnerType;
  bankName: string | null;
  bankBranch: string | null;
  bankAccount: string | null;
  regime: TaxRegime | null;
  benefitDetail: string | null;
  notes: string | null;
}

export interface IcmsDestinationRate {
  id: string;
  destinationPurpose: DestinationPurpose;
  collectedRate: number | null;
  effectiveRate: number | null;
  regime?: TaxRegime | null;
  notes: string | null;
}

export interface IcmsProfile {
  id: string;
  paymentAccountType: AccountOwnerType;
  bankName: string | null;
  bankBranch: string | null;
  bankAccount: string | null;
  regime: TaxRegime | null;
  collectedRate: number | null;
  effectiveRate: number | null;
  notes: string | null;
  destinationRates: IcmsDestinationRate[];
}

export interface ScopeOperationTaxes {
  federalTaxes: FederalTaxProfile | null;
  afrmm: AfrmmProfile | null;
  icms: IcmsProfile | null;
}

export interface ScopeTaxes {
  importTaxes: ScopeOperationTaxes | null;
  exportTaxes: ScopeOperationTaxes | null;
}

export interface ScopeServiceFreightDetail {
  type: "FREIGHT";
  id: string;
  mode: string | null;
  negotiatedPtax: number | null;
  generalNotes: string | null;
}

export interface ScopeServiceInsuranceDetail {
  type: "INSURANCE";
  id: string;
  minimumAmount: number | null;
  cfrPercentage: number | null;
  policyInclusionDate: string | null;
  additionalDescription: string | null;
}

export interface ScopeServiceCustomsBrokerDetail {
  type: "CUSTOMS_BROKER";
  id: string;
  salaryMultiplier: number | null;
  pricingReference: string | null;
}

export interface ScopeServiceCertificateDetail {
  type: "CERTIFICATE";
  id: string;
  certificateName: string | null;
  issuingAuthority: string | null;
  notes: string | null;
}

export type ScopeServiceDetail =
  | ScopeServiceFreightDetail
  | ScopeServiceInsuranceDetail
  | ScopeServiceCustomsBrokerDetail
  | ScopeServiceCertificateDetail;

export interface ScopeServiceItem {
  id: string;
  catalogId: string;
  code: string | null;
  name: string | null;
  serviceType: ServiceType | null;
  operationType: ServiceOperationType;
  enabled: boolean;
  pricingType: PricingType | null;
  amount: number | null;
  currency: string;
  responsibleUser: IUser | null;
  lastUpdatedOn: string | null;
  notes: string | null;
  details: ScopeServiceDetail | null;
}

export interface ScopePrepostoCity {
  id: string;
  city: string;
  state: string | null;
}

export interface ScopePrepostoResponse {
  id: string;
  prepostoId?: string | null;
  prepostoName?: string | null;
  manualPrepostoName?: string | null;
  manualPrepostoNotes?: string | null;
  operationType: OperationType;
  enabled: boolean;
  amount: number | null;
  includedInCascoCustomsClearance: boolean | null;
  otherPort: string | null;
  otherBorder: string | null;
  notes: string | null;
  cities: ScopePrepostoCity[];
}

export interface ScopeServices {
  items: ScopeServiceItem[];
  prepostos: ScopePrepostoResponse[];
}

export interface RefundBankAccount {
  id: string;
  bankName: string | null;
  branch: string | null;
  account: string | null;
}

export interface ScopeFinancial {
  id?: string;
  paymentPreference: PaymentPreference | null;
  refundPixKey: string | null;
  notes: string | null;
  refundBankAccounts: RefundBankAccount[];
}

export interface ScopeGeneral {
  id?: string;
  description: string | null;
}

export interface ScopeDetailResponse {
  id: string;
  status: ScopeStatus;
  version: number;

  createdAt: string | null;
  updatedAt: string | null;
  lastPublishedAt: string | null;

  company: CompanyInfo | null;
  contacts: ContactInfo[];

  assignments: Assignments;
  operations: ScopeOperations;
  taxes: ScopeTaxes;
  services: ScopeServices;
  financial: ScopeFinancial;
  general: ScopeGeneral;

  createdBy: IUser | null;
}

export interface ScopeDraftResponse {
  id: string;
  status: "draft" | "published" | "archived";
  version: number;
  draft: EscopoForm;
}

export interface CreateScopeResponse {
  id: string;
}

export interface SaveScopeDraftPayload {
  id: string;
  draft: EscopoForm;
}

export type ScopeVersionsResponse = ScopeVersion[];

export interface ScopeSummaryApi {
  id: string;
  status: ScopeStatus;
  version?: number | null;
  updated_at?: string | null;
  last_published_at?: string | null;
  client_id?: string | null;
  client_cnpj?: string | null;
  client_razao_social?: string | null;
  responsible_user_id?: string | null;
  responsible_user_nome?: string | null;
}

export interface BulkReassignResponsiblePayload {
  old_user_id: string;
  new_user_id: string;
  apply_status?: ScopeStatus[];
  only_active_assignments?: boolean;
  dry_run?: boolean;
}

export interface BulkReassignResponsibleResponse {
  dry_run: boolean;
  affected_scopes: number;
  scope_ids: string[];
}

export type BulkAssignmentGroupBy =
  | "responsavel_comercial"
  | "analista_da"
  | "analista_ae";

export interface BulkAssignmentSummaryItem {
  userId: string;
  userName: string;
  userRole: string;
  userSetor: string;
  totalScopes: number;
}

export interface BulkAssignmentSummaryResponse {
  groupBy: BulkAssignmentGroupBy;
  totalUsers: number;
  totalScopes: number;
  items: BulkAssignmentSummaryItem[];
}

export interface BulkAssignmentScopeItem {
  id: string;
  status: ScopeStatus;
  clientName: string;
  clientCnpj: string;
  updatedAt: string;
}

export interface BulkAssignmentScopesResponse {
  groupBy: BulkAssignmentGroupBy;
  userId: string;
  total: number;
  items: BulkAssignmentScopeItem[];
}

export interface BulkAssignmentUpdatePayload {
  groupBy: BulkAssignmentGroupBy;
  fromUserId: string;
  toUserId: string;
  scopeIds: string[];
}

export interface BulkAssignmentUpdateResponse {
  ok: boolean;
  impactedScopes: number;
  updatedScopeIds: string[];
}

export interface ScopeApiClient {
  createScope(initial?: Partial<EscopoForm>): Promise<CreateScopeResponse>;
  saveScopeDraft(payload: SaveScopeDraftPayload): Promise<void>;
  listScopes(params: ListScopesParams): Promise<ListScopesResult>;
  countUserAssignments(): Promise<{ type: string; count: number }[]>;
  getScope(id: string): Promise<ScopeDetailResponse>;
  getScopeDraft(id: string): Promise<ScopeDraftResponse>
  saveScope(payload: SaveScopeDraftPayload): Promise<void>;
  publishScope(id: string, data: { draft: EscopoForm }): Promise<PublishResult>;
  deleteScope(id: string): Promise<void>;
  listScopeVersions(id: string): Promise<ScopeVersionsResponse>;
  getMetadata(): Promise<ScopeMetadataResponse>;
  bulkReassignResponsible(
    payload: BulkReassignResponsiblePayload,
  ): Promise<BulkReassignResponsibleResponse>;
  getBulkAssignmentSummary(
    groupBy: BulkAssignmentGroupBy,
  ): Promise<BulkAssignmentSummaryResponse>;
  getBulkAssignmentScopes(
    groupBy: BulkAssignmentGroupBy,
    userId: string,
  ): Promise<BulkAssignmentScopesResponse>;
  updateBulkAssignment(
    payload: BulkAssignmentUpdatePayload,
  ): Promise<BulkAssignmentUpdateResponse>;
}
