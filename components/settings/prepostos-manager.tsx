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
import { PrepostoLookupItem, PrepostoLookupResponse } from "@/lib/api/types/public-api";

const emptyPreposto = (): PrepostoLookupItem => ({
  id: `preposto-${Date.now()}`,
  cidade: "",
  contatoNome: null,
  descricaoLocal: null,
  email: null,
  moeda: null,
  nome: "",
  observacoes: null,
  operacao: "IMPORTACAO",
  telefone: null,
  uf: null,
  valor: null,
  valorDescricao: null,
});

type PrepostosManagerProps = {
  settings: PrepostoLookupResponse;
  onSave?: (payload: PrepostoLookupResponse) => Promise<void>;
};

export function PrepostosManager({ settings, onSave }: PrepostosManagerProps) {
  const [current, setCurrent] = useState<PrepostoLookupResponse>(settings);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PrepostoLookupItem | null>(null);

  const prepostos = current.items ?? [];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return prepostos;

    return prepostos.filter((item) => {
      const localidade = [item.cidade, item.uf, item.descricaoLocal].filter(Boolean).join(" ").toLowerCase();

      return (
        item.nome.toLowerCase().includes(normalizedQuery) ||
        localidade.includes(normalizedQuery) ||
        (item.contatoNome ?? "").toLowerCase().includes(normalizedQuery) ||
        (item.email ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [prepostos, query]);

  const openCreate = () => {
    setEditing(emptyPreposto());
    setOpen(true);
  };

  const openEdit = (item: PrepostoLookupItem) => {
    setEditing({ ...item });
    setOpen(true);
  };

  const upsert = () => {
    if (!editing) return;

    const exists = prepostos.some((item) => item.id === editing.id);
    const nextItems = exists
      ? prepostos.map((item) => (item.id === editing.id ? editing : item))
      : [...prepostos, editing];

    setCurrent({
      items: nextItems,
      total: nextItems.length,
    });

    setOpen(false);
  };

  const remove = (id: string) => {
    const nextItems = prepostos.filter((item) => item.id !== id);

    setCurrent({
      items: nextItems,
      total: nextItems.length,
    });
  };

  const saveAll = async () => {
    if (!onSave) return;

    try {
      setSaving(true);
      await onSave(current);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Contatos de prepostos</CardTitle>
          <Button onClick={openCreate}>Gerenciar registros</Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Buscar por nome, cidade, UF, contato ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">
            Total: {filtered.length} de {current.total}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localidade</TableHead>
              <TableHead>Operação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{formatLocalidade(item)}</TableCell>
                  <TableCell>{item.operacao ?? "-"}</TableCell>
                  <TableCell>{item.valorDescricao ?? item.valor ?? "-"}</TableCell>
                  <TableCell>{item.contatoNome ?? "-"}</TableCell>
                  <TableCell>
                    <details className="relative">
                      <summary className="flex cursor-pointer list-none justify-center">
                        <MoreHorizontal className="size-4" />
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-32 rounded-md border bg-background p-1 shadow">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => openEdit(item)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive"
                          onClick={() => remove(item.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </details>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {onSave ? (
          <div className="mt-4">
            <Button onClick={saveAll} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        ) : null}
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {prepostos.some((item) => item.id === editing?.id) ? "Editar registro" : "Novo registro"}
            </SheetTitle>
          </SheetHeader>

          {editing ? (
            <div className="mt-4 grid gap-3 pb-8">
              <Field label="Nome">
                <Input
                  value={editing.nome}
                  onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                />
              </Field>

              <Field label="Cidade">
                <Input
                  value={editing.cidade}
                  onChange={(e) => setEditing({ ...editing, cidade: e.target.value })}
                />
              </Field>

              <Field label="UF">
                <Input
                  value={editing.uf ?? ""}
                  onChange={(e) => setEditing({ ...editing, uf: emptyToNull(e.target.value) })}
                />
              </Field>

              <Field label="Descrição do local">
                <Input
                  value={editing.descricaoLocal ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, descricaoLocal: emptyToNull(e.target.value) })
                  }
                />
              </Field>

              <Field label="Operação">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={editing.operacao ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      operacao: (e.target.value || null) as PrepostoLookupItem["operacao"],
                    })
                  }
                >
                  <option value="">Selecione</option>
                  <option value="IMPORTACAO">Importação</option>
                  <option value="EXPORTACAO">Exportação</option>
                </select>
              </Field>

              <Field label="Contato">
                <Input
                  value={editing.contatoNome ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, contatoNome: emptyToNull(e.target.value) })
                  }
                />
              </Field>

              <Field label="Telefone">
                <Input
                  value={editing.telefone ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, telefone: emptyToNull(e.target.value) })
                  }
                />
              </Field>

              <Field label="E-mail">
                <Input
                  value={editing.email ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: emptyToNull(e.target.value) })
                  }
                />
              </Field>

              <Field label="Moeda">
                <Input
                  value={editing.moeda ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, moeda: emptyToNull(e.target.value) })
                  }
                />
              </Field>

              <Field label="Valor">
                <Input
                  value={editing.valor ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, valor: emptyToNull(e.target.value) })
                  }
                  placeholder="Ex.: 150.00"
                />
              </Field>

              <Field label="Descrição do valor">
                <Input
                  value={editing.valorDescricao ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, valorDescricao: emptyToNull(e.target.value) })
                  }
                  placeholder="Ex.: USD 150,00"
                />
              </Field>

              <Field label="Observações">
                <Textarea
                  value={editing.observacoes ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, observacoes: emptyToNull(e.target.value) })
                  }
                />
              </Field>

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

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function formatLocalidade(item: PrepostoLookupItem) {
  const base = [item.cidade, item.uf].filter(Boolean).join(" / ");
  if (item.descricaoLocal) {
    return base ? `${base} - ${item.descricaoLocal}` : item.descricaoLocal;
  }
  return base || "-";
}