"use client";

import useSWR from "swr";
import { importProcessesApi } from "@/lib/api/services/import-processes";
import type { ListImportProcessesParams } from "@/lib/api/types/import-process-api";

export function useImportProcesses(params?: ListImportProcessesParams) {
  const key = `tracker:import-processes:${JSON.stringify(params ?? {})}`;

  return useSWR(key, () => importProcessesApi.listProcesses(params));
}

export function useImportProcess(processId: string | null) {
  const key = processId ? `tracker:import-process:${processId}` : null;

  return useSWR(key, () => {
    if (!processId) throw new Error("Processo inválido.");
    return importProcessesApi.getProcess(processId);
  });
}
