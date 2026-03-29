"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminSettingsApi } from "@/lib/api/services/admin-settings";
import type { AdminSettingsResponse, PrepostoAdminContact } from "@/lib/api/types/scope-metadata";

const emptyPreposto = (): PrepostoAdminContact => ({
  id: `preposto-${Date.now()}`,
  nome: "",
  localidade: "",
  operacao: "IMPORTACAO",
  contatoNome: "",
  telefone: "",
  email: "",
  valor: 0,
  observacoes: "",
});

export function PrepostosManager({ settings }: { settings: AdminSettingsResponse }) {
  const [current, setCurrent] = useState(settings);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PrepostoAdminContact | null>(null);

  const prepostos = current.prepostosContatos ?? [];
  const filtered = useMemo(
    () => prepostos.filter((item) => item.nome.toLowerCase().includes(query.toLowerCase()) || item.localidade.toLowerCase().includes(query.toLowerCase())),
    [prepostos, query],
  );

  const openCreate = () => {
    setEditing(emptyPreposto());
    setOpen(true);
  };

  const openEdit = (item: PrepostoAdminContact) => {
    setEditing({ ...item });
    setOpen(true);
  };

  const upsert = () => {
    if (!editing) return;
    const exists = prepostos.some((item) => item.id === editing.id);
    const nextItems = exists
      ? prepostos.map((item) => (item.id === editing.id ? editing : item))
      : [...prepostos, editing];
    setCurrent({ ...current, prepostosContatos: nextItems });
    setOpen(false);
  };

  const remove = (id: string) => {
    setCurrent({
      ...current,
      prepostosContatos: prepostos.filter((item) => item.id !== id),
    });
  };

  const saveAll = async () => {
    setSaving(true);
    await adminSettingsApi.updateSettings(current);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Contatos de prepostos</CardTitle>
          <Button onClick={openCreate}>Gerenciar registros</Button>
        </div>
        <Input placeholder="Buscar por nome ou localidade" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localidade</TableHead>
              <TableHead>Operação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nome}</TableCell>
                <TableCell>{item.localidade}</TableCell>
                <TableCell>{item.operacao}</TableCell>
                <TableCell>{item.valor}</TableCell>
                <TableCell>
                  <details className="relative">
                    <summary className="flex cursor-pointer list-none justify-center"><MoreHorizontal className="size-4" /></summary>
                    <div className="absolute right-0 z-10 mt-1 w-32 rounded-md border bg-background p-1 shadow">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => openEdit(item)}>Editar</Button>
                      <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => remove(item.id)}>Excluir</Button>
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button onClick={saveAll} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{prepostos.some((item) => item.id === editing?.id) ? "Editar registro" : "Novo registro"}</SheetTitle>
          </SheetHeader>
          {editing ? (
            <div className="mt-4 grid gap-3 pb-8">
              <Field label="Nome"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
              <Field label="Localidade"><Input value={editing.localidade} onChange={(e) => setEditing({ ...editing, localidade: e.target.value })} /></Field>
              <Field label="Operação">
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={editing.operacao} onChange={(e) => setEditing({ ...editing, operacao: e.target.value as PrepostoAdminContact['operacao'] })}>
                  <option value="IMPORTACAO">Importação</option>
                  <option value="EXPORTACAO">Exportação</option>
                </select>
              </Field>
              <Field label="Contato"><Input value={editing.contatoNome ?? ""} onChange={(e) => setEditing({ ...editing, contatoNome: e.target.value })} /></Field>
              <Field label="Telefone"><Input value={editing.telefone ?? ""} onChange={(e) => setEditing({ ...editing, telefone: e.target.value })} /></Field>
              <Field label="E-mail"><Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
              <Field label="Valor"><Input type="number" value={editing.valor} onChange={(e) => setEditing({ ...editing, valor: Number(e.target.value) })} /></Field>
              <Field label="Observações"><Textarea value={editing.observacoes ?? ""} onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })} /></Field>
              <Button onClick={upsert}>Salvar registro</Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
