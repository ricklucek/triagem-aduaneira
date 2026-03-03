"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export function StepContacts() {
  const { control, register } = useFormContext<Scope>();
  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Contatos ({fields.length})</div>
        <Button
          type="button"
          className="rounded-xl"
          onClick={() => append({ nome: "", cargoDepartamento: "", email: "", telefone: "", observacao: "" })}
        >
          Adicionar contato
        </Button>
      </div>

      <Separator />

      <div className="grid gap-3">
        {fields.map((f, i) => (
          <Card key={f.id} className="rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Contato #{i + 1}</div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => remove(i)}>
                Remover
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Nome</div>
                <Input className="rounded-xl" {...register(`contacts.${i}.nome`)} />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Cargo/Departamento</div>
                <Input className="rounded-xl" {...register(`contacts.${i}.cargoDepartamento`)} />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">E-mail</div>
                <Input className="rounded-xl" placeholder="nome@empresa.com" {...register(`contacts.${i}.email`)} />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Telefone</div>
                <Input className="rounded-xl" placeholder="(11) 99999-9999" {...register(`contacts.${i}.telefone`)} />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground">Observação</div>
                <Textarea className="min-h-20 rounded-xl" {...register(`contacts.${i}.observacao`)} />
              </div>
            </div>
          </Card>
        ))}

        {fields.length === 0 && (
          <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
            Nenhum contato ainda. Recomenda-se adicionar pelo menos 1 (warning).
          </div>
        )}
      </div>
    </div>
  );
}