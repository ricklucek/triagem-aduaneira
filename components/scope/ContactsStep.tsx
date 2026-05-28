"use client";

import { Plus, Trash2 } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack, Toolbar } from "@/components/ui/form-layout";

import {
  emptyContact,
} from "./canonical-draft";


function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

export default function ContactsStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const contacts = form.contacts ?? [];

  function update(index: number, patch: any) {
    const next = [...contacts];
    next[index] = { ...next[index], ...patch };
    patchForm({ contacts: next } as Partial<EscopoForm>);
  }

  function remove(index: number) {
    patchForm({ contacts: contacts.filter((_, current) => current !== index) } as Partial<EscopoForm>);
  }

  return (
    <Stack>
      <Toolbar
        left={<h3 className="text-base font-semibold">Contatos</h3>}
        right={<Button type="button" variant="outline" onClick={() => patchForm({ contacts: [...contacts, emptyContact(false)] } as Partial<EscopoForm>)}><Plus className="mr-2 h-4 w-4" />Adicionar contato</Button>}
      />
      {contacts.map((contact, index) => (
        <Card key={contact.id ?? index}>
          <Toolbar
            left={<Badge variant={contact.primary ? "default" : "secondary"}>Contato {index + 1}{contact.primary ? " • Principal" : ""}</Badge>}
            right={contacts.length > 1 ? <Button type="button" variant="outline" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button> : null}
          />
          <Grid columns={2}>
            <Field label="Nome" required error={fieldError(errors, `contacts.${index}.name`)}>
              <TextInput value={contact.name ?? ""} onChange={(e) => update(index, { name: e.target.value })} />
            </Field>
            <Field label="Cargo / departamento" required error={fieldError(errors, `contacts.${index}.departmentRole`)}>
              <TextInput value={contact.departmentRole ?? ""} onChange={(e) => update(index, { departmentRole: e.target.value })} />
            </Field>
            <Field label="E-mail" required error={fieldError(errors, `contacts.${index}.email`)}>
              <TextInput value={contact.email ?? ""} onChange={(e) => update(index, { email: e.target.value })} />
            </Field>
            <Field label="Telefone" required error={fieldError(errors, `contacts.${index}.phone`)}>
              <TextInput value={contact.phone ?? ""} onChange={(e) => update(index, { phone: e.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <TextInput value={contact.whatsapp ?? ""} onChange={(e) => update(index, { whatsapp: e.target.value })} />
            </Field>
            <div className="flex items-end gap-3 pb-2">
              <Checkbox label="Contato principal" checked={Boolean(contact.primary)} onChange={(checked) => update(index, { primary: checked })} />
              <Checkbox label="Ativo" checked={contact.active !== false} onChange={(checked) => update(index, { active: checked })} />
            </div>
          </Grid>
        </Card>
      ))}
    </Stack>
  );
}