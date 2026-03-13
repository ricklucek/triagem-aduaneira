export const API_ROUTES = {
  scopes: {
    create: "/scopes",
    list: "/scopes",
    detail: (scopeId: string) => `/scopes/${scopeId}`,
    saveDraft: (scopeId: string) => `/scopes/${scopeId}/draft`,
    publish: (scopeId: string) => `/scopes/${scopeId}/publish`,
    versions: (scopeId: string) => `/scopes/${scopeId}/versions`,
  },
} as const;
