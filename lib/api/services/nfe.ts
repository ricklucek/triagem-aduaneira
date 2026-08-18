import { http } from "@/lib/api/config/http";
import { API_ROUTES } from "@/lib/api/config/routes";
import type {
  DuimpSnapshotDetail,
  FiscalEnvironment,
  FiscalProfilePayload,
  ImportPurpose,
  ImportTaxRulePayload,
  ListImportProcessClientGroupsResponse,
  ListImportProcessesResponse,
  ListProviderConnectionsResponse,
  NfeDraftDetailResponse,
  NfeDraftSummary,
  NfeItemClassificationState,
  NfeNumberSequencePayload,
  NfeContextState,
  ResolveNfeContextPayload,
  UpdateNfeDraftPayload,
  NfeWorkflowState,
  NfeXmlValidationResult,
  NfeXmlVersionSummary,
} from "@/lib/api/types/nfe-api";

export const nfeApi = {
  async listProviderConnections(params: {
    provider: "portal_unico";
    environment: FiscalEnvironment;
    status: "active";
    limit?: number;
  }): Promise<ListProviderConnectionsResponse> {
    const { data } = await http.get<ListProviderConnectionsResponse>(
      API_ROUTES.nfe.providerConnections,
      { params },
    );
    return data;
  },

  async saveProviderConnection(payload: {
    importer_id?: string | null;
    provider: "portal_unico";
    environment: FiscalEnvironment;
    auth_type: "api_key";
    status: "active";
    credentials_ref: string;
    config_json: { role_type: "IMPEXP" };
  }) {
    const { data } = await http.post(
      API_ROUTES.nfe.providerConnections,
      payload,
    );
    return data;
  },

  async listProcessClientGroups(params: {
    q?: string;
    created_by_me?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ListImportProcessClientGroupsResponse> {
    const { data } = await http.get<ListImportProcessClientGroupsResponse>(
      API_ROUTES.nfe.processClientGroups,
      { params },
    );
    return data;
  },

  async listProcesses(params: {
    q?: string;
    status?: string;
    importer_id?: string;
    created_by_me?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ListImportProcessesResponse> {
    const { data } = await http.get<ListImportProcessesResponse>(
      API_ROUTES.nfe.processes,
      { params },
    );
    return data;
  },

  async createProcess(payload: {
    importer_id: string;
    reference_code: string;
    duimp_number: string;
    source: "portal_unico";
  }) {
    const { data } = await http.post<{ id: string }>(API_ROUTES.nfe.processes, payload);
    return data;
  },

  async fetchDuimp(processId: string, providerEnvironment: FiscalEnvironment) {
    const { data } = await http.post<{ snapshot: DuimpSnapshotDetail }>(
      API_ROUTES.nfe.fetchDuimp(processId),
      { provider_environment: providerEnvironment, source_provider: "portal_unico", enrich_catalog: true },
    );
    return data;
  },

  async getWorkflowState(
    processId: string,
    params: { import_purpose?: ImportPurpose; environment: FiscalEnvironment; series: string },
  ): Promise<NfeWorkflowState> {
    const { data } = await http.get<NfeWorkflowState>(API_ROUTES.nfe.workflowState(processId), { params });
    return data;
  },

  async resolveContext(
    processId: string,
    payload: ResolveNfeContextPayload,
  ): Promise<NfeContextState> {
    const { data } = await http.post<NfeContextState>(
      API_ROUTES.nfe.resolveContext(processId),
      payload,
    );
    return data;
  },

  async saveItemClassifications(
    processId: string,
    payload: {
      duimp_snapshot_id: string;
      items: Array<{
        duimp_item_number: string;
        import_purpose: ImportPurpose;
        tax_rule_id?: string | null;
      }>;
    },
  ): Promise<NfeItemClassificationState> {
    const { data } = await http.put<NfeItemClassificationState>(
      API_ROUTES.nfe.itemClassifications(processId),
      payload,
    );
    return data;
  },

  async listDrafts(processId: string): Promise<{ items: NfeDraftSummary[] }> {
    const { data } = await http.get<{ items: NfeDraftSummary[] }>(API_ROUTES.nfe.drafts(processId));
    return data;
  },

  async listSnapshots(processId: string): Promise<DuimpSnapshotDetail[]> {
    const { data } = await http.get<DuimpSnapshotDetail[]>(API_ROUTES.nfe.snapshots(processId));
    return data;
  },

  async createDraft(processId: string, payload: {
    environment: FiscalEnvironment;
    series: string;
    import_purpose: ImportPurpose;
    duimp_snapshot_id?: string;
  }) {
    const { data } = await http.post<{ draft: { id: string }; validation: { valid: boolean } }>(
      API_ROUTES.nfe.createDraft(processId),
      payload,
    );
    return data;
  },

  async getDraft(draftId: string): Promise<NfeDraftDetailResponse> {
    const { data } = await http.get<NfeDraftDetailResponse>(
      API_ROUTES.nfe.draft(draftId),
    );
    return data;
  },

  async updateDraft(draftId: string, payload: UpdateNfeDraftPayload) {
    const { data } = await http.patch<{
      draft: NfeDraftDetailResponse["draft"];
      items: NfeDraftDetailResponse["items"];
      validation: {
        valid: boolean;
        errors?: Array<Record<string, unknown>>;
        warnings?: Array<Record<string, unknown>>;
      };
      requires_new_xml: boolean;
    }>(API_ROUTES.nfe.draft(draftId), payload);
    return data;
  },

  async validateDraft(draftId: string) {
    const { data } = await http.post<{ valid: boolean; errors?: Array<Record<string, unknown>> }>(
      API_ROUTES.nfe.validateDraft(draftId),
      {},
    );
    return data;
  },

  async generateAccessKey(draftId: string) {
    const { data } = await http.post(API_ROUTES.nfe.generateAccessKey(draftId), {});
    return data;
  },

  async generateXml(draftId: string): Promise<NfeXmlVersionSummary> {
    const { data } = await http.post<NfeXmlVersionSummary>(API_ROUTES.nfe.generateXml(draftId), {});
    return data;
  },

  async validateXml(
    draftId: string,
    xmlVersionId: string,
  ): Promise<NfeXmlValidationResult> {
    const { data } = await http.post<NfeXmlValidationResult>(
      API_ROUTES.nfe.validateXml(draftId, xmlVersionId),
      {},
    );
    return data;
  },

  async downloadXml(draftId: string, xmlVersionId: string) {
    const { data } = await http.get<string>(
      API_ROUTES.nfe.downloadXml(draftId, xmlVersionId),
    );
    return {
      blob: new Blob([data], { type: "application/xml;charset=utf-8" }),
      filename: `NFe-${xmlVersionId}.xml`,
    };
  },

  async getFiscalProfile(clientId: string): Promise<FiscalProfilePayload> {
    const { data } = await http.get<FiscalProfilePayload>(API_ROUTES.clients.fiscalProfile(clientId));
    return data;
  },

  async saveFiscalProfile(clientId: string, payload: FiscalProfilePayload) {
    const { data } = await http.put(API_ROUTES.clients.fiscalProfile(clientId), payload);
    return data;
  },

  async listTaxRules(clientId: string): Promise<Array<{ id: string; name: string; import_purpose: ImportPurpose; active: boolean }>> {
    const { data } = await http.get<Array<{ id: string; name: string; import_purpose: ImportPurpose; active: boolean }>>(API_ROUTES.clients.importTaxRules(clientId));
    return data;
  },

  async createTaxRule(clientId: string, payload: ImportTaxRulePayload) {
    const { data } = await http.post(API_ROUTES.clients.importTaxRules(clientId), payload);
    return data;
  },

  async listNumberSequences(clientId: string): Promise<Array<Record<string, unknown>>> {
    const { data } = await http.get<Array<Record<string, unknown>>>(API_ROUTES.clients.nfeNumberSequences(clientId));
    return data;
  },

  async saveNumberSequence(clientId: string, payload: NfeNumberSequencePayload) {
    const { data } = await http.put(API_ROUTES.clients.nfeNumberSequences(clientId), payload);
    return data;
  },
};
