export const API_ROUTES = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  scopes: {
    create: (templateId?: string | number) => (templateId ? `/scopes?templateId=${templateId}` : `/scopes`),
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
    countUserAssignments: "/scopes/user/assigned-count",
    bulkAssignmentSummary: "/scopes/bulk/assignment-summary",
    bulkAssignmentScopes: "/scopes/bulk/assignment-scopes",
    bulkAssignmentUpdate: "/scopes/bulk/assignment-update",
    templates: "/scopes/templates",
    templateDetail: (templateId: string) => `/scopes/templates/${templateId}`,
  },
  organizations: {
    me: "/organizations/me",
    settings: "/organizations/me/settings",
    settingsByKey: (key: string) => `/organizations/settings/${key}`,
  },
  clients: {
    create: "/clients",
    list: "/clients",
    detail: (clientId: string) => `/clients/${clientId}`,
    update: (clientId: string) => `/clients/${clientId}`,
    scopes: (clientId: string) => `/clients/${clientId}/scopes`,
    fiscalProfile: (clientId: string) => `/clients/${clientId}/fiscal-profile`,
    importTaxRules: (clientId: string) => `/clients/${clientId}/import-tax-rules`,
    nfeNumberSequences: (clientId: string) =>
      `/clients/${clientId}/nfe-number-sequences`,
  },
  nfe: {
    providerConnections: "/external-provider-connections",
    processes: "/import-processes",
    process: (processId: string) => `/import-processes/${processId}`,
    workflowState: (processId: string) =>
      `/import-processes/${processId}/nfe-workflow-state`,
    fetchDuimp: (processId: string) =>
      `/import-processes/${processId}/duimp/fetch`,
    snapshots: (processId: string) =>
      `/import-processes/${processId}/duimp-snapshots`,
    drafts: (processId: string) =>
      `/import-processes/${processId}/nfe-drafts`,
    createDraft: (processId: string) =>
      `/import-processes/${processId}/nfe-draft/from-duimp`,
    validateDraft: (draftId: string) => `/nfe-drafts/${draftId}/validate`,
    generateAccessKey: (draftId: string) =>
      `/nfe-drafts/${draftId}/generate-access-key`,
    generateXml: (draftId: string) => `/nfe-drafts/${draftId}/generate-xml`,
    validateXml: (draftId: string, xmlVersionId: string) =>
      `/nfe-drafts/${draftId}/xml-versions/${xmlVersionId}/validate-xsd`,
    downloadXml: (draftId: string, xmlVersionId: string) =>
      `/nfe-drafts/${draftId}/xml-versions/${xmlVersionId}/download`,
  },
  dashboards: {
    admin: "/dashboards/admin",
    adminMetrics: "/dashboards/admin/metrics",
    adminScopesByUser: "/dashboards/admin/scopes-by-user",
    adminUserScopes: (userId: string) =>
      `/dashboards/admin/users/${userId}/scopes`,
    adminServices: "/dashboards/admin/services",
    adminServicesByScope: "/dashboards/admin/services/by-scope",
    adminClientsByUser: "/dashboards/admin/clients-by-user",
    adminUserClients: (userId: string) =>
      `/dashboards/admin/users/${userId}/clients`,
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
      return `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
    },
    prepostosLookup: "/prepostos/public/lookup",
  },
} as const;
