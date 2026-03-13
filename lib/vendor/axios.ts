export type AxiosRequestConfig = {
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
};

export type AxiosResponse<T> = {
  data: T;
  status: number;
};

export class AxiosError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AxiosError";
    this.status = status;
  }
}

function buildUrl(baseURL: string | undefined, url: string, params?: AxiosRequestConfig["params"]) {
  const full = `${baseURL ?? ""}${url}`;
  const parsed = new URL(full, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) parsed.searchParams.set(k, String(v));
    }
  }
  return parsed.toString();
}

async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", baseURL: string | undefined, url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const target = buildUrl(baseURL, url, config?.params);
  const res = await fetch(target, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(config?.headers ?? {}),
    },
    body: config?.body ? JSON.stringify(config.body) : undefined,
  });

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : `HTTP ${res.status}`;
    throw new AxiosError(message, res.status);
  }

  return { data: payload as T, status: res.status };
}

export type AxiosInstance = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
};

function create(config?: AxiosRequestConfig): AxiosInstance {
  const baseURL = config?.baseURL;

  return {
    get: <T>(url: string, cfg?: AxiosRequestConfig) => request<T>("GET", baseURL, url, cfg),
    post: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) => request<T>("POST", baseURL, url, { ...cfg, body }),
    put: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) => request<T>("PUT", baseURL, url, { ...cfg, body }),
    patch: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) => request<T>("PATCH", baseURL, url, { ...cfg, body }),
    delete: <T>(url: string, cfg?: AxiosRequestConfig) => request<T>("DELETE", baseURL, url, cfg),
  };
}

const axios = { create };
export default axios;
