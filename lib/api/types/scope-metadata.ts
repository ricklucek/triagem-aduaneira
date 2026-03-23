export interface PrepostoAdminContact {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  atendeImportacao: boolean;
  atendeExportacao: boolean;
  valor: number;
  observacoes?: string;
}

export interface AdminSettingsResponse {
  salarioMinimoVigente: number;
  dadosBancariosCasco: {
    banco: string;
    agencia: string;
    conta: string;
  };
  prepostosContatos?: PrepostoAdminContact[];
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
