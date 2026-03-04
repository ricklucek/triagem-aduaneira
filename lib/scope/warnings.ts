import type { Scope } from "./schema";

export type ScopeWarning = { path: string; message: string };

export function getScopeWarnings(scope: Scope): ScopeWarning[] {
  const w: ScopeWarning[] = [];

  if (!scope.client?.cnpj) w.push({ path: "client.cnpj", message: "CNPJ não informado." });
  if (!scope.client?.razaoSocial) w.push({ path: "client.razaoSocial", message: "Razão social não informada." });

  if (!scope.contacts?.length) w.push({ path: "contacts", message: "Nenhum contato cadastrado (recomendado ao menos 1)." });
  else if (!scope.contacts.some(c => !!c.email)) w.push({ path: "contacts", message: "Nenhum e-mail informado nos contatos." });

  const ops = scope.operation?.types ?? [];
  if (ops.length === 0) w.push({ path: "operation.types", message: "Selecione Importação e/ou Exportação." });

  if (ops.includes("IMPORTACAO")) {
    if (!scope.importSection?.modal) w.push({ path: "importSection.modal", message: "Modal de importação não selecionado." });
    if (!scope.importSection?.entryLocations?.length) w.push({ path: "importSection.entryLocations", message: "Local de entrada (importação) vazio." });
    if (!scope.importSection?.releaseWarehouses?.length) w.push({ path: "importSection.releaseWarehouses", message: "Armazém de liberação (importação) vazio." });
    if (!scope.importSection?.ncm?.length) w.push({ path: "importSection.ncm", message: "NCM (importação) vazio." });
  }

  if (ops.includes("EXPORTACAO")) {
    if (!scope.exportSection?.modal) w.push({ path: "exportSection.modal", message: "Modal de exportação não selecionado." });
    if (!scope.exportSection?.departureLocations?.length) w.push({ path: "exportSection.departureLocations", message: "Portos/fronteiras (exportação) vazio." });
    if (!scope.exportSection?.ncm?.length) w.push({ path: "exportSection.ncm", message: "NCM (exportação) vazio." });
  }

  if (ops.includes("EXPORTACAO")) {
    const hasAnyExportService = scope.services?.some(s => s.operationScope === "EXPORTACAO") ?? false;
    if (!hasAnyExportService) w.push({ path: "services(EXP)", message: "Nenhum serviço de exportação configurado." });

    const origem = scope.services?.find(s => s.operationScope === "EXPORTACAO" && s.code === "CERTIFICADO_ORIGEM");
    if (origem && !origem.amount) w.push({ path: "services.CERTIFICADO_ORIGEM", message: "Certificado de Origem: valor não informado." });

    const fito = scope.services?.find(s => s.operationScope === "EXPORTACAO" && s.code === "CERTIFICADO_FITOSSANITARIO");
    if (fito && !fito.amount) w.push({ path: "services.CERTIFICADO_FITOSSANITARIO", message: "Certificado Fitossanitário: valor não informado." });

    const outros = scope.services?.find(s => s.operationScope === "EXPORTACAO" && s.code === "OUTROS_CERTIFICADOS");
    if (outros) {
      if (!outros.extra?.description) w.push({ path: "services.OUTROS_CERTIFICADOS.desc", message: "Outros certificados: descrição não informada." });
      if (!outros.amount) w.push({ path: "services.OUTROS_CERTIFICADOS.valor", message: "Outros certificados: valor não informado." });
    }
  }

  if (ops.includes("IMPORTACAO")) {
    const hasAnyImportService = scope.services?.some(s => s.operationScope === "IMPORTACAO") ?? false;
    if (!hasAnyImportService) w.push({ path: "services", message: "Nenhum serviço de importação configurado." });

    const despacho = scope.services?.find(s => s.operationScope === "IMPORTACAO" && s.code === "DESPACHO_ADUANEIRO");
    if (despacho?.pricingModel === "FIXED" && !despacho.amount) w.push({ path: "services.DESPACHO_ADUANEIRO", message: "Despacho: valor fixo não informado." });

    const preposto = scope.services?.find(s => s.operationScope === "IMPORTACAO" && s.code === "PREPOSTO");
    if (preposto && !preposto.amount) w.push({ path: "services.PREPOSTO", message: "Preposto: valor não informado." });

    const frete = scope.services?.find(s => s.operationScope === "IMPORTACAO" && s.code === "FRETE_INTERNACIONAL");
    if (frete && (frete.extra?.percent == null)) w.push({ path: "services.FRETE_INTERNACIONAL", message: "Frete: percentual não informado." });

    if (scope.importSection?.liLpco?.enabled && !(scope.importSection.liLpco.anuencias?.length)) {
      w.push({ path: "importSection.liLpco.anuencias", message: "LI/LPCO marcado como Sim, mas anuências não selecionadas." });
    }
  }

  // serviços rule-driven (ainda opcional no MVP)
  // você pode adicionar warning: se import selecionada e não tem serviço import
  return w;
}