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
    saveScope: (scopeId: string) => `/scopes/${scopeId}`,
    publish: (scopeId: string) => `/scopes/${scopeId}/publish`,
    versions: (scopeId: string) => `/scopes/${scopeId}/versions`,
    delete: (scopeId: string) => `/scopes/${scopeId}`,
    bulkReassignResponsible: "/scopes/bulk/reassign-responsible",
    stale: "/scopes/stale",
    expired: "/scopes/expired",
    pendingAdjustments: "/scopes/pending-adjustments",
    byPerson: "/scopes/analytics/by-person",
    bySector: "/scopes/analytics/by-sector",
    monthlyCreated: "/scopes/analytics/monthly-created",
  },
  organizations: {
    me: "/organizations/me",
    settings: "/organizations/me/settings",
  },
  clients: {
    list: "/clients",
    detail: (clientId: string) => `/clients/${clientId}`,
    update: (clientId: string) => `/clients/${clientId}`,
    scopes: (clientId: string) => `/clients/${clientId}/scopes`,
  },
  dashboards: {
    admin: "/dashboards/admin",
    comercial: "/dashboards/comercial",
    credenciamento: "/dashboards/credenciamento",
    operacao: "/dashboards/operacao",
  },
  users: {
    listUsers: "/users",
    listAdmins: "/users/admin",
    listResponsibles: "/users/responsibles",
    create: "/users",
    update: (userId: string) => `/users/user/${userId}`,
    deleteUser: (userId: string) => `/users/user/${userId}`,
    deleteAdmin: (userId: string) => `/users/admin/${userId}`,
  },
  analytics: {
    comercialAveragePrice: "/analytics/comercial/average-price",
  },
  public: {
    cnpjLookup(cnpj: string) {
      return `https://minhareceita.org/${cnpj}`;
    },
    prepostosLookup: "/prepostos/public/lookup",
  },
} as const;
