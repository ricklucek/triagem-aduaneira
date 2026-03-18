"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasRole } from "@/lib/auth/guard";
import { useAdminDashboard, useAdminSettings } from "@/lib/api/hooks/use-dashboards";
import { adminSettingsApi } from "@/lib/api/services/admin-settings";

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  const { data: settings, mutate: mutateSettings } = useAdminSettings();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    salarioMinimoVigente: 0,
    dadosBancariosCasco: { banco: "", agencia: "", conta: "" },
  });

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;
  if (isLoading || !settings) return <p>Carregando métricas do administrador...</p>;
  if (error || !data) return <p>Falha ao carregar o painel administrativo.</p>;

  const currentForm = dirty ? form : settings;

  async function saveSettings() {
    setSaving(true);
    await adminSettingsApi.updateSettings(currentForm);
    setDirty(false);
    await mutateSettings();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel do Administrador</h1>
        <Link href="/admin/users">
          <Button>Gerenciar usuários</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Metric title="Escopos criados no último mês" value={data.createdLastMonth} />
        <Metric title="Escopos desatualizados" value={data.outdatedScopes} />
        <Metric title="Total de escopos" value={data.totalScopes} />
        <Metric title="Média cobrada pelo comercial" value={data.comercialAveragePrice} prefix="R$ " />
      </div>

      <Card>
        <CardHeader><CardTitle>Informações fixas</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Salário mínimo vigente</Label><Input type="number" value={currentForm.salarioMinimoVigente} onChange={(e) => { setDirty(true); setForm({ ...currentForm, salarioMinimoVigente: Number(e.target.value) }); }} /></div>
          <div className="space-y-2"><Label>Banco</Label><Input value={currentForm.dadosBancariosCasco.banco} onChange={(e) => { setDirty(true); setForm({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, banco: e.target.value } }); }} /></div>
          <div className="space-y-2"><Label>Agência</Label><Input value={currentForm.dadosBancariosCasco.agencia} onChange={(e) => { setDirty(true); setForm({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, agencia: e.target.value } }); }} /></div>
          <div className="space-y-2"><Label>Conta</Label><Input value={currentForm.dadosBancariosCasco.conta} onChange={(e) => { setDirty(true); setForm({ ...currentForm, dadosBancariosCasco: { ...currentForm.dadosBancariosCasco, conta: e.target.value } }); }} /></div>
          <div className="md:col-span-2"><Button onClick={saveSettings} disabled={saving}>{saving ? "Salvando..." : "Salvar informações fixas"}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Escopos por responsável</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Responsável</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{data.scopesByPerson.map((item) => <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Escopos por setor</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{data.scopesBySector.map((item) => <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, prefix = "" }: { title: string; value: number; prefix?: string }) {
  return <Card><CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{prefix}{value}</p></CardContent></Card>;
}
