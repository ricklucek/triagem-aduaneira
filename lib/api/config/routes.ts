export const API_ROUTES = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  scopes: {
    create: "/scopes",
    list: "/scopes",
    metadata: "/scopes/metadata",
    detail: (scopeId: string) => `/scopes/${scopeId}`,
    saveDraft: (scopeId: string) => `/scopes/${scopeId}/draft`,
    publish: (scopeId: string) => `/scopes/${scopeId}/publish`,
    versions: (scopeId: string) => `/scopes/${scopeId}/versions`,
    stale: "/scopes/stale",
    expired: "/scopes/expired",
    pendingAdjustments: "/scopes/pending-adjustments",
    byPerson: "/scopes/analytics/by-person",
    bySector: "/scopes/analytics/by-sector",
    monthlyCreated: "/scopes/analytics/monthly-created",
  },
  admin: {
    settings: "/admin/settings",
  },
  dashboards: {
    admin: "/dashboards/admin",
    comercial: "/dashboards/comercial",
    credenciamento: "/dashboards/credenciamento",
    operacao: "/dashboards/operacao",
  },
  users: {
    list: "/users",
    create: "/users",
  },
  analytics: {
    comercialAveragePrice: "/analytics/comercial/average-price",
  },
  public: {
    cnpjLookup(cnpj: string) {
      return `https://minhareceita.org/${cnpj}`;
    },
    prepostosLookup: "/public/prepostos",
  },
} as const;
