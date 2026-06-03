import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  ImportProcess,
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

  async getProcess(processId: string) {
    const { data } = await http.get<ImportProcess>(
      API_ROUTES.tracker.importProcessDetail(processId),
    );

    return data;
  },
};
