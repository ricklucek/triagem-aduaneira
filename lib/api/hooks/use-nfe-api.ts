"use client";

import useSWR from "swr";
import { nfeApi } from "@/lib/api/services/nfe";
import type { FiscalEnvironment, ImportPurpose } from "@/lib/api/types/nfe-api";

export function useNfeClientGroups(params: {
  q?: string;
  created_by_me?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useSWR(
    `nfe-client-groups:${JSON.stringify(params)}`,
    () => nfeApi.listProcessClientGroups(params),
  );
}

export function useNfeProcesses(params: {
  q?: string;
  status?: string;
  importer_id?: string;
  created_by_me?: boolean;
  limit?: number;
  offset?: number;
} | null) {
  return useSWR(
    params ? `nfe-processes:${JSON.stringify(params)}` : null,
    () => nfeApi.listProcesses(params as NonNullable<typeof params>),
  );
}

export function useNfeWorkflowState(
  processId: string | null,
  params: { import_purpose?: ImportPurpose; environment: FiscalEnvironment; series: string },
) {
  return useSWR(
    processId ? `nfe-workflow:${processId}:${JSON.stringify(params)}` : null,
    () => nfeApi.getWorkflowState(processId as string, params),
  );
}

export function useNfeDrafts(processId: string | null) {
  return useSWR(
    processId ? `nfe-drafts:${processId}` : null,
    () => nfeApi.listDrafts(processId as string),
  );
}

export function useDuimpSnapshots(processId: string | null) {
  return useSWR(
    processId ? `duimp-snapshots:${processId}` : null,
    () => nfeApi.listSnapshots(processId as string),
  );
}
