"use client";

import useSWR from "swr";
import { authApi } from "@/lib/api/services/auth";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "@/lib/auth/session-storage";
import type { LoginPayload } from "@/lib/api/types/auth-api";

export function useCurrentUser() {
  return useSWR("auth:me", authApi.me, {
    revalidateOnFocus: false,
  });
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await authApi.login(payload);
  setAuthSession({ user: response.user, tokens: response.tokens });
  return response.user;
}

export async function logoutSession() {
  try {
    await authApi.logout();
  } finally {
    clearAuthSession();
  }
}

export function getSessionRole() {
  return getAuthSession()?.user.role;
}
