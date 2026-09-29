"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Pencil, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { usersApi } from "@/lib/api/services/users";
import type { UserTag, UserTagColor } from "@/lib/api/types/dashboard-api";
import { UserTagBadge } from "@/components/settings/user-tag-badge";

const colors: { value: UserTagColor; label: string }[] = [
  { value: "slate", label: "Cinza" },
  { value: "blue", label: "Azul" },
  { value: "emerald", label: "Verde" },
  { value: "amber", label: "Âmbar" },
  { value: "violet", label: "Violeta" },
  { value: "rose", label: "Rosa" },
];

const emptyForm = {
  name: "",
  description: "",
  color: "slate" as UserTagColor,
};

export function UserTagManagerSheet({
  tags,
  trigger,
  onSaved,
}: {
  tags: UserTag[];
  trigger: ReactNode;
  onSaved: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const orderedTags = useMemo(
    () => [...tags].sort((a, b) => Number(b.is_master) - Number(a.is_master) || a.name.localeCompare(b.name)),
    [tags],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEditing = (tag: UserTag) => {
    setEditingId(tag.id);
    setForm({
      name: tag.name,
      description: tag.description ?? "",
      color: tag.color,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await usersApi.updateTag(editingId, form);
        toast.success("Tag atualizada com sucesso.");
      } else {
        await usersApi.createTag(form);
        toast.success("Tag criada com sucesso.");
      }
      resetForm();
      await onSaved();
    } catch {
      toast.error("Não foi possível salvar a tag.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = async (tag: UserTag) => {
    try {
      await usersApi.updateTag(tag.id, { active: !tag.active });
      toast.success(tag.active ? "Tag inativada." : "Tag reativada.");
      await onSaved();
    } catch {
      toast.error("Não foi possível alterar o status da tag.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => {
      setOpen(next);
      if (!next) resetForm();
    }}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Tags de usuários</SheetTitle>
          <SheetDescription>
            Organize funções operacionais sem alterar as permissões técnicas do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
          <form className="space-y-4 rounded-xl border bg-muted/20 p-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{editingId ? "Editar tag" : "Nova tag"}</h3>
                <p className="text-xs text-muted-foreground">
                  O código interno é gerado automaticamente na criação.
                </p>
              </div>
              {editingId ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Nome</Label>
                <Input
                  id="tag-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Ex.: Financeiro"
                  maxLength={80}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select
                  value={form.color}
                  onValueChange={(value) => setForm({ ...form, color: value as UserTagColor })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-description">Descrição</Label>
              <Textarea
                id="tag-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Explique quando esta tag deve ser utilizada."
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? <RotateCw className="size-4 animate-spin" /> : editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Criar tag"}
            </Button>
          </form>

          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Catálogo da organização</h3>
              <p className="text-sm text-muted-foreground">
                Tags inativas permanecem no histórico, mas não podem receber novos usuários.
              </p>
            </div>
            <div className="divide-y rounded-xl border">
              {orderedTags.map((tag) => (
                <div key={tag.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserTagBadge tag={tag} />
                      {tag.is_system ? <span className="text-xs text-muted-foreground">Padrão do sistema</span> : null}
                      {!tag.active ? <span className="text-xs font-medium text-destructive">Inativa</span> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{tag.description || "Sem descrição."}</p>
                    <p className="text-xs text-muted-foreground">{tag.users_count ?? 0} usuário(s)</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEditing(tag)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant={tag.active ? "outline" : "secondary"}
                      size="sm"
                      disabled={tag.is_master}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.active ? "Inativar" : "Reativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
