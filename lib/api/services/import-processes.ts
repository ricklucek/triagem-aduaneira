import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  CreateImportProcessPayload,
  ImportProcessApi,
  ImportProcessesResponse,
  ListImportProcessesParams,
} from "@/lib/api/types/import-process-api";

export const importProcessesApi = {
  async listProcesses(params?: ListImportProcessesParams) {
    const { data } = await http.get<ImportProcessesResponse>(
      API_ROUTES.tracker.importProcesses,
      { params: params ? { ...params } : undefined },
    );

    return data;
  },

  async listDepartmentProcesses(department: "customs_clearance" | "international_freight" | "international_insurance" | "road_freight" | "financial", params?: ListImportProcessesParams) {
    const { data } = await http.get<ImportProcessesResponse>(
      API_ROUTES.tracker.departmentProcesses(department),
      { params: params ? { ...params } : undefined },
    );

    return data;
  },

  async getProcess(processId: string) {
    const { data } = await http.get<ImportProcessApi>(
      API_ROUTES.tracker.importProcessDetail(processId),
    );

    return data;
  },

  async createProcess(payload: CreateImportProcessPayload) {
    const { data } = await http.post<ImportProcessApi>(
      API_ROUTES.tracker.importProcesses,
      payload,
    );

    return data;
  },
};
