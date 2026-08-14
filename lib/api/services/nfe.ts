import { http } from "@/lib/api/config/http";
import { API_ROUTES } from "@/lib/api/config/routes";
import type {
  FiscalEnvironment,
  FiscalProfilePayload,
  ImportPurpose,
  ImportTaxRulePayload,
  ListImportProcessesResponse,
  NfeNumberSequencePayload,
  NfeWorkflowState,
} from "@/lib/api/types/nfe-api";

export const nfeApi = {
  async listProcesses(params: {
    q?: string;
    status?: string;
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

  async fetchDuimp(processId: string, environment: FiscalEnvironment) {
    const { data } = await http.post(API_ROUTES.nfe.fetchDuimp(processId), {
      provider_environment: environment,
      source_provider: "portal_unico",
      enrich_catalog: true,
    });
    return data;
  },

  async getWorkflowState(
    processId: string,
    params: { import_purpose?: ImportPurpose; environment: FiscalEnvironment; series: string },
  ): Promise<NfeWorkflowState> {
    const { data } = await http.get<NfeWorkflowState>(
      API_ROUTES.nfe.workflowState(processId),
      { params },
    );
    return data;
  },

  async getFiscalProfile(clientId: string): Promise<FiscalProfilePayload> {
    const { data } = await http.get<FiscalProfilePayload>(
      API_ROUTES.clients.fiscalProfile(clientId),
    );
    return data;
  },

  async saveFiscalProfile(clientId: string, payload: FiscalProfilePayload) {
    const { data } = await http.put(
      API_ROUTES.clients.fiscalProfile(clientId),
      payload,
    );
    return data;
  },

  async listTaxRules(clientId: string): Promise<Array<{ id: string; name: string; import_purpose: ImportPurpose; active: boolean }>> {
    const { data } = await http.get<Array<{ id: string; name: string; import_purpose: ImportPurpose; active: boolean }>>(
      API_ROUTES.clients.importTaxRules(clientId),
    );
    return data;
  },

  async createTaxRule(clientId: string, payload: ImportTaxRulePayload) {
    const { data } = await http.post(
      API_ROUTES.clients.importTaxRules(clientId),
      payload,
    );
    return data;
  },

  async listNumberSequences(clientId: string): Promise<Array<Record<string, unknown>>> {
    const { data } = await http.get<Array<Record<string, unknown>>>(
      API_ROUTES.clients.nfeNumberSequences(clientId),
    );
    return data;
  },

  async saveNumberSequence(clientId: string, payload: NfeNumberSequencePayload) {
    const { data } = await http.put(
      API_ROUTES.clients.nfeNumberSequences(clientId),
      payload,
    );
    return data;
  },
};
