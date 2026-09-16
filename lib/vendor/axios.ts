export type AxiosRequestConfig = {
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  responseType?: "text" | "blob";
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

function buildUrl(
  baseURL: string | undefined,
  url: string,
  params?: AxiosRequestConfig["params"],
) {
  const full = `${baseURL ?? ""}${url}`;
  const parsed = new URL(
    full,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) parsed.searchParams.set(k, String(v));
    }
  }
  return parsed.toString();
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  baseURL: string | undefined,
  url: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const target = buildUrl(baseURL, url, config?.params);
  const sourceBody = config?.body;
  const isMultipart =
    typeof FormData !== "undefined" && sourceBody instanceof FormData;
  const headers = { ...(config?.headers ?? {}) };

  if (isMultipart) {
    // O navegador precisa definir o boundary do multipart. Um Content-Type
    // manual, sem esse boundary, faz o servidor receber request.files vazio.
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === "content-type") delete headers[name];
    }
  } else if (
    !Object.keys(headers).some((name) => name.toLowerCase() === "content-type")
  ) {
    headers["Content-Type"] = "application/json";
  }

  const body =
    sourceBody === undefined || sourceBody === null
      ? undefined
      : isMultipart
        ? sourceBody
        : JSON.stringify(sourceBody);

  const res = await fetch(target, {
    method,
    headers,
    body,
  });

  let payload: unknown = null;
  if (config?.responseType === "blob" && res.ok) {
    payload = await res.blob();
  } else {
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `HTTP ${res.status}`;
    throw new AxiosError(message, res.status);
  }

  return { data: payload as T, status: res.status };
}

export type AxiosInstance = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  post<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;
  put<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;
  patch<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;
  delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;
};

function create(config?: AxiosRequestConfig): AxiosInstance {
  const baseURL = config?.baseURL;

  return {
    get: <T>(url: string, cfg?: AxiosRequestConfig) =>
      request<T>("GET", baseURL, url, cfg),
    post: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
      request<T>("POST", baseURL, url, { ...cfg, body }),
    put: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
      request<T>("PUT", baseURL, url, { ...cfg, body }),
    patch: <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
      request<T>("PATCH", baseURL, url, { ...cfg, body }),
    delete: <T>(url: string, cfg?: AxiosRequestConfig) =>
      request<T>("DELETE", baseURL, url, cfg),
  };
}

const axios = { create };
export default axios;
