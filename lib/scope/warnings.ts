import type { Scope } from "./schema";

export type ScopeWarning = { path: string; message: string };

export function getScopeWarnings(scope: Scope): ScopeWarning[] {
  const w: ScopeWarning[] = [];

  if (!scope.client?.cnpj) w.push({ path: "client.cnpj", message: "CNPJ não informado." });
  if (!scope.client?.razaoSocial) w.push({ path: "client.razaoSocial", message: "Razão social não informada." });

  if (!scope.contacts?.length) w.push({ path: "contacts", message: "Nenhum contato cadastrado (recomendado ao menos 1)." });
  else if (!scope.contacts.some(c => !!c.email)) w.push({ path: "contacts", message: "Nenhum e-mail informado nos contatos." });

  if (!scope.operation?.modal) w.push({ path: "operation.modal", message: "Modal não selecionado." });
  if (!scope.operation?.localEntradaId) w.push({ path: "operation.localEntradaId", message: "Local de entrada não selecionado." });
  if (!scope.operation?.localLiberacaoId) w.push({ path: "operation.localLiberacaoId", message: "Local de liberação não selecionado." });

  if (!scope.operation?.ncm?.length) w.push({ path: "operation.ncm", message: "NCM não informado (array)." });
  if (!scope.services?.length) w.push({ path: "services", message: "Nenhum serviço contratado informado." });
  if (scope.services?.some(s => !s.valor && !s.regraCalculo))
    w.push({ path: "services", message: "Há serviços sem valor e sem regra de cálculo (ex.: PTAX 8%, 0,99%)." });

  return w;
}