"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasRole } from "@/lib/auth/guard";
import { useAdminDashboard, useAdminSettings } from "@/lib/api/hooks/use-dashboards";
import { adminSettingsApi } from "@/lib/api/services/admin-settings";
import type { AdminSettingsResponse, PrepostoAdminContact } from "@/lib/api/types/scope-metadata";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const emptyPreposto = (): PrepostoAdminContact => ({ id: `preposto-${Date.now()}`, nome: "", localidade: "", operacao: "IMPORTACAO", contatoNome: "", telefone: "", email: "", valor: 0, observacoes: "" });

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const { data: settings, mutate: mutateSettings } = useAdminSettings();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreposto, setEditingPreposto] = useState<PrepostoAdminContact | null>(null);
  const [operationFilter, setOperationFilter] = useState<"TODOS" | "IMPORTACAO" | "EXPORTACAO">("TODOS");
  const [localidadeFilter, setLocalidadeFilter] = useState("");
  const [form, setForm] = useState<AdminSettingsResponse>({ salarioMinimoVigente: 0, dadosBancariosCasco: { banco: "", agencia: "", conta: "" }, prepostosContatos: [] });

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;
  if (isLoading || !settings) return <p>Carregando métricas do administrador...</p>;
  if (error || !data) return <p>Falha ao carregar o painel administrativo.</p>;

  const currentForm = dirty ? form : { ...settings, prepostosContatos: settings.prepostosContatos ?? [] };
  const prepostos = currentForm.prepostosContatos ?? [];
  const filteredPrepostos = useMemo(() => prepostos.filter((item) => (operationFilter === "TODOS" || item.operacao === operationFilter) && (!localidadeFilter.trim() || item.localidade.toLowerCase().includes(localidadeFilter.trim().toLowerCase()))), [localidadeFilter, operationFilter, prepostos]);

  async function saveSettings(nextForm?: AdminSettingsResponse) { const payload = nextForm ?? currentForm; setSaving(true); await adminSettingsApi.updateSettings(payload); setDirty(false); await mutateSettings(); setSaving(false); }
  function updateCurrent(next: AdminSettingsResponse) { setDirty(true); setForm(next); }
  function openCreateDialog() { setEditingPreposto(emptyPreposto()); setDialogOpen(true); }
  function openEditDialog(item: PrepostoAdminContact) { setEditingPreposto({ ...item }); setDialogOpen(true); }
  function upsertPreposto() { if (!editingPreposto) return; const nextItems = prepostos.some((item) => item.id === editingPreposto.id) ? prepostos.map((item) => item.id === editingPreposto.id ? editingPreposto : item) : [...prepostos, editingPreposto]; updateCurrent({ ...currentForm, prepostosContatos: nextItems }); setDialogOpen(false); setEditingPreposto(null); }
  function removePreposto(id: string) { updateCurrent({ ...currentForm, prepostosContatos: prepostos.filter((item) => item.id !== id) }); }

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Painel do Administrador</h1><Link href="/admin/users"><Button>Gerenciar usuários</Button></Link></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Metric title="Escopos criados no último mês" value={data.createdLastMonth} /><Metric title="Escopos desatualizados" value={data.outdatedScopes} /><Metric title="Total de escopos" value={data.totalScopes} /><Metric title="Média cobrada pelo comercial" value={data.comercialAveragePrice} prefix="R$ " /></div>
    <Card><CardHeader><CardTitle>Informações fixas</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Salário mínimo vigente</Label><Input type="number" value={currentForm.salarioMinimoVigente} onChange={(e) => updateCurrent({ ...currentForm, salarioMinimoVigente: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Banco</Label><Input value={currentForm.dadosBancariosCasco.banco} onChange={(e) => updateCurrent({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, banco: e.target.value } })} /></div><div className="space-y-2"><Label>Agência</Label><Input value={currentForm.dadosBancariosCasco.agencia} onChange={(e) => updateCurrent({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, agencia: e.target.value } })} /></div><div className="space-y-2"><Label>Conta</Label><Input value={currentForm.dadosBancariosCasco.conta} onChange={(e) => updateCurrent({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, conta: e.target.value } })} /></div><div className="md:col-span-2"><Button onClick={() => saveSettings()} disabled={saving}>{saving ? "Salvando..." : "Salvar informações fixas"}</Button></div></CardContent></Card>
    <Card><CardHeader className="gap-4"><div className="flex flex-row items-center justify-between"><CardTitle>Contatos de preposto</CardTitle><Button onClick={openCreateDialog}>Adicionar registro</Button></div><div className="flex flex-wrap gap-2"><Button variant={operationFilter === "TODOS" ? "default" : "outline"} onClick={() => setOperationFilter("TODOS")}>Todos</Button><Button variant={operationFilter === "IMPORTACAO" ? "default" : "outline"} onClick={() => setOperationFilter("IMPORTACAO")}>Importação</Button><Button variant={operationFilter === "EXPORTACAO" ? "default" : "outline"} onClick={() => setOperationFilter("EXPORTACAO")}>Exportação</Button><Input className="max-w-xs" placeholder="Buscar localidade" value={localidadeFilter} onChange={(e) => setLocalidadeFilter(e.target.value)} /></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Localidade</TableHead><TableHead>Valor</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{filteredPrepostos.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum preposto encontrado para o filtro atual.</TableCell></TableRow> : filteredPrepostos.map((item) => <TableRow key={item.id}><TableCell>{item.nome}</TableCell><TableCell>{item.localidade}</TableCell><TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valor)}</TableCell><TableCell><details><summary className="cursor-pointer text-sm font-medium">Abrir menu</summary><div className="mt-2 flex flex-col gap-2"><Button variant="outline" onClick={() => openEditDialog(item)}>Editar</Button><Button variant="destructive" onClick={() => removePreposto(item.id)}>Excluir</Button></div></details></TableCell></TableRow>)}</TableBody></Table><div className="mt-4"><Button onClick={() => saveSettings()} disabled={saving}>{saving ? "Salvando..." : "Salvar contatos de preposto"}</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Escopos por responsável</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Responsável</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{data.scopesByPerson.map((item) => <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Card><CardHeader><CardTitle>Escopos por setor</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{data.scopesBySector.map((item) => <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingPreposto && prepostos.some((item) => item.id === editingPreposto.id) ? "Editar contato de preposto" : "Novo contato de preposto"}</DialogTitle><DialogDescription>Cadastre os dados administrativos do preposto e da sua localidade de atendimento.</DialogDescription></DialogHeader>{editingPreposto ? <div className="grid gap-4"><div className="space-y-2"><Label>Nome</Label><Input value={editingPreposto.nome} onChange={(e) => setEditingPreposto({ ...editingPreposto, nome: e.target.value })} /></div><div className="space-y-2"><Label>Localidade</Label><Input value={editingPreposto.localidade} onChange={(e) => setEditingPreposto({ ...editingPreposto, localidade: e.target.value })} /></div><div className="space-y-2"><Label>Operação</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={editingPreposto.operacao} onChange={(e) => setEditingPreposto({ ...editingPreposto, operacao: e.target.value as PrepostoAdminContact["operacao"] })}><option value="IMPORTACAO">Importação</option><option value="EXPORTACAO">Exportação</option></select></div><div className="space-y-2"><Label>Contato</Label><Input value={editingPreposto.contatoNome ?? ""} onChange={(e) => setEditingPreposto({ ...editingPreposto, contatoNome: e.target.value })} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={editingPreposto.telefone ?? ""} onChange={(e) => setEditingPreposto({ ...editingPreposto, telefone: e.target.value })} /></div><div className="space-y-2"><Label>E-mail</Label><Input value={editingPreposto.email ?? ""} onChange={(e) => setEditingPreposto({ ...editingPreposto, email: e.target.value })} /></div><div className="space-y-2"><Label>Valor</Label><Input type="number" value={editingPreposto.valor} onChange={(e) => setEditingPreposto({ ...editingPreposto, valor: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Observações</Label><Textarea value={editingPreposto.observacoes ?? ""} onChange={(e) => setEditingPreposto({ ...editingPreposto, observacoes: e.target.value })} /></div></div> : null}<DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={upsertPreposto}>Salvar contato</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
function Metric({ title, value, prefix = "" }: { title: string; value: number; prefix?: string }) { return <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{prefix}{value}</p></CardContent></Card>; }
