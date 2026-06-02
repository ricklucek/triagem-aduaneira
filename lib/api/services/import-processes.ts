import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  ImportProcess,
  ImportProcessesResponse,
  ListImportProcessesParams,
} from "@/lib/api/types/import-process-api";

function normalizeImportProcesses(
  response: ImportProcessesResponse,
): ImportProcess[] {
  if (Array.isArray(response)) return response;
  return response.data ?? response.items ?? response.processes ?? [];
}

export const importProcessesApi = {
  async listProcesses(params?: ListImportProcessesParams) {
    const { data } = await http.get<ImportProcessesResponse>(
      API_ROUTES.tracker.importProcesses,
      { params: params ? { ...params } : undefined },
    );

    return normalizeImportProcesses(data);
  },
};
