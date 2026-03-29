import { useSyncExternalStore } from "react";
import type { AuthTokens, AuthUser } from "@/lib/api/types/auth-api";

const AUTH_STORAGE_KEY = "triagem.auth.session";
const AUTH_EVENT = "triagem.auth.session.changed";

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

let cachedRaw: string | null = null;
let cachedSession: AuthSession | null = null;

function emitSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readSessionFromStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (raw === null) {
    cachedRaw = null;
    cachedSession = null;
    return null;
  }

  if (raw === cachedRaw) {
    return cachedSession;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    cachedRaw = raw;
    cachedSession = parsed;
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedRaw = null;
    cachedSession = null;
    emitSessionChange();
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  return readSessionFromStorage();
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(session);
  localStorage.setItem(AUTH_STORAGE_KEY, raw);

  cachedRaw = raw;
  cachedSession = session;

  emitSessionChange();
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  cachedRaw = null;
  cachedSession = null;

  emitSessionChange();
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== AUTH_STORAGE_KEY) return;

    // invalida cache antes de avisar o React
    cachedRaw = null;
    cachedSession = null;
    callback();
  };

  const onCustomEvent = () => {
    cachedRaw = null;
    cachedSession = null;
    callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_EVENT, onCustomEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_EVENT, onCustomEvent);
  };
}

function getServerSnapshot(): AuthSession | null {
  return null;
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, getAuthSession, getServerSnapshot);
}
