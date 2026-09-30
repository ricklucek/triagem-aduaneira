"use client";

import useSWR from "swr";

import { auditApi } from "@/lib/api/services/audit";
import type { AuditEventFilters } from "@/lib/api/types/audit-api";

export function useAuditEvents(filters: AuditEventFilters) {
  return useSWR(
    `audit:events:${JSON.stringify(filters)}`,
    () => auditApi.listEvents(filters),
  );
}

export function useAuditEventOptions() {
  return useSWR("audit:events:options", auditApi.getOptions);
}
