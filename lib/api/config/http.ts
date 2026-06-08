import axios, { AxiosError, type AxiosRequestConfig } from "@/lib/vendor/axios";
import { API_ROUTES } from "@/lib/api/config/routes";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "@/lib/auth/session-storage";
import type { RefreshResponse } from "@/lib/api/types/auth-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL não definida.");
}

const rawHttp = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise: Promise<string | null> | null = null;
let isRedirectingToLogin = false;

function getAxiosStatus(error: unknown): number | undefined {
  if (!(error instanceof AxiosError)) return undefined;

  return error.status;
}

function forceLogoutAndRedirect() {
  clearAuthSession();

  /**
   * Evita erro durante SSR/build do Next.js.
   * Esse arquivo pode ser importado em contextos onde `window` não existe.
   */
  if (typeof window === "undefined") return;

  /**
   * Evita múltiplos redirects simultâneos caso várias requests retornem 401
   * ao mesmo tempo.
   */
  if (isRedirectingToLogin) return;

  isRedirectingToLogin = true;

  const currentPath = window.location.pathname + window.location.search;

  /**
   * Evita loop caso o usuário já esteja na tela de login.
   */
  if (window.location.pathname === "/login") return;

  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;

  window.location.replace(loginUrl);
}

async function withAuth<T>(
  fn: (headers: Record<string, string>) => Promise<T>,
): Promise<T> {
  const session = getAuthSession();

  const initialHeaders: Record<string, string> = {};

  if (session?.tokens.accessToken) {
    initialHeaders.Authorization = `Bearer ${session.tokens.accessToken}`;
  } else {
    forceLogoutAndRedirect();
  }

  try {
    return await fn(initialHeaders);
  } catch (error) {
    const status = getAxiosStatus(error);

    if (
      status !== 401 ||
      !session?.tokens.refreshToken
    ) {
      throw error;
    }

    if (!refreshPromise) {
      refreshPromise = rawHttp
        .post<RefreshResponse>(API_ROUTES.auth.refresh, {
          refreshToken: session.tokens.refreshToken,
        })
        .then(({ data }) => {
          setAuthSession({
            ...session,
            tokens: data.tokens,
          });

          return data.tokens.accessToken;
        })
        .catch(() => {
          forceLogoutAndRedirect();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const accessToken = await refreshPromise;

    if (!accessToken) {
      throw error;
    }

    return fn({
      Authorization: `Bearer ${accessToken}`,
    });
  }
}

function mergeConfig(
  config: AxiosRequestConfig | undefined,
  headers: Record<string, string>,
): AxiosRequestConfig {
  return {
    ...config,
    headers: {
      ...(config?.headers ?? {}),
      ...headers,
    },
  };
}

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return withAuth((headers) =>
      rawHttp.get<T>(url, mergeConfig(config, headers)),
    );
  },

  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return withAuth((headers) =>
      rawHttp.post<T>(url, body, mergeConfig(config, headers)),
    );
  },

  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return withAuth((headers) =>
      rawHttp.put<T>(url, body, mergeConfig(config, headers)),
    );
  },

  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return withAuth((headers) =>
      rawHttp.patch<T>(url, body, mergeConfig(config, headers)),
    );
  },

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return withAuth((headers) =>
      rawHttp.delete<T>(url, mergeConfig(config, headers)),
    );
  },
};