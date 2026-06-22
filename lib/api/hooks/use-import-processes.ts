"use client";

import useSWR from "swr";
import { importProcessesApi } from "@/lib/api/services/import-processes";
import type { DepartmentBoardProcessesParams, ListImportProcessesParams } from "@/lib/api/types/import-process-api";

export function useImportProcesses(params?: ListImportProcessesParams) {
  const key = `tracker:import-processes:${JSON.stringify(params ?? {})}`;

  return useSWR(key, () => importProcessesApi.listProcesses(params));
}

export function useDepartmentBoardProcesses(department: "customs_clearance" | "international_freight" | "international_insurance" | "road_freight" | "financial", params?: DepartmentBoardProcessesParams) {
  const key = `tracker:department-board:${department}:${JSON.stringify(params ?? {})}`;

  return useSWR(key, () => importProcessesApi.listDepartmentProcesses(department, params));
}

export function useImportProcess(processId: string | null) {
  const key = processId ? `tracker:import-process:${processId}` : null;

  return useSWR(key, () => {
    if (!processId) throw new Error("Processo inválido.");
    return importProcessesApi.getProcess(processId);
  });
}
