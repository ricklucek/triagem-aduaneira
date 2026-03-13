"use client";

import { getAuthSession } from "@/lib/auth/session-storage";
import type { UserRole } from "@/lib/api/types/auth-api";

export function hasRole(required: UserRole | UserRole[]) {
  const session = getAuthSession();
  if (!session) return false;

  if (Array.isArray(required)) {
    return required.includes(session.user.role);
  }

  return session.user.role === required;
}
