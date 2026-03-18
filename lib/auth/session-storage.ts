import { useSyncExternalStore } from "react";
import type { AuthTokens, AuthUser } from "@/lib/api/types/auth-api";

const AUTH_STORAGE_KEY = "triagem.auth.session";
const AUTH_EVENT = "triagem.auth.session.changed";

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

function emitSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    emitSessionChange();
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitSessionChange();
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitSessionChange();
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== AUTH_STORAGE_KEY) return;
    callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, getAuthSession, () => null);
}
