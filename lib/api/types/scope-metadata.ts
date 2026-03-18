export interface AdminSettingsResponse {
  salarioMinimoVigente: number;
  dadosBancariosCasco: {
    banco: string;
    agencia: string;
    conta: string;
  };
}

export interface ScopeResponsible {
  id: string;
  nome: string;
  email: string;
  role: string;
  setor: string;
}

export interface ScopeMetadataResponse {
  informacoesFixas: AdminSettingsResponse;
  responsaveis: ScopeResponsible[];
}

export type UpdateAdminSettingsPayload = AdminSettingsResponse;
