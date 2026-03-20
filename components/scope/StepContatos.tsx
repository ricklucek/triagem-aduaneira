"use client";

import { EscopoForm } from "@/domain/scope/types";
import { Field, TextInput } from "@/components/ui/form-fields";
import {
  Card,
  DangerButton,
  Grid,
  PrimaryButton,
  Section,
  Stack,
  Toolbar,
} from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepContatos({ form, errors, onChange }: Props) {
  function updateContato(index: number, patch: Partial<(typeof form.contatos)[number]>) {
    const next = [...form.contatos];
    next[index] = { ...next[index], ...patch };
    onChange({ ...form, contatos: next });
  }

  function addContato() {
    onChange({
      ...form,
      contatos: [
        ...form.contatos,
        { nome: "", cargoDepartamento: "", email: "", telefone: "" },
      ],
    });
  }

  function removeContato(index: number) {
    onChange({
      ...form,
      contatos: form.contatos.filter((_, i) => i !== index),
    });
  }

  return (
    <main className="gap-5 flex flex-col">
      <Toolbar
        right={<PrimaryButton type="button" onClick={addContato}>+ Adicionar contato</PrimaryButton>}
      />

      <Stack gap={12}>
        {form.contatos.map((contato, index) => (
          <Card key={index}>
            <Toolbar
              left={<strong>Contato {index + 1}</strong>}
              right={
                form.contatos.length > 1 ? (
                  <DangerButton type="button" onClick={() => removeContato(index)}>
                    Remover
                  </DangerButton>
                ) : null
              }
            />

            <Grid columns={2}>
              <Field
                label="Nome"
                required
                error={errors[`contatos.${index}.nome`]}
              >
                <TextInput
                  value={contato.nome}
                  onChange={(e) => updateContato(index, { nome: e.target.value })}
                />
              </Field>

              <Field
                label="Cargo/Departamento"
                required
                error={errors[`contatos.${index}.cargoDepartamento`]}
              >
                <TextInput
                  value={contato.cargoDepartamento}
                  onChange={(e) =>
                    updateContato(index, { cargoDepartamento: e.target.value })
                  }
                />
              </Field>

              <Field
                label="E-mail"
                required
                error={errors[`contatos.${index}.email`]}
              >
                <TextInput
                  value={contato.email}
                  onChange={(e) => updateContato(index, { email: e.target.value })}
                />
              </Field>

              <Field
                label="Telefone"
                required
                error={errors[`contatos.${index}.telefone`]}
              >
                <TextInput
                  value={contato.telefone}
                  onChange={(e) =>
                    updateContato(index, { telefone: e.target.value })
                  }
                />
              </Field>
            </Grid>
          </Card>
        ))}
      </Stack>

      {errors ? <div className="text-sm font-medium text-destructive">{errors['contatos']}</div> : null}
      {errors ? <div className="text-sm font-medium text-destructive">{errors['nome']}</div> : null}
      {errors ? <div className="text-sm font-medium text-destructive">{errors['cargoDepartamento']}</div> : null}
      {errors ? <div className="text-sm font-medium text-destructive">{errors['email']}</div> : null}
      {errors ? <div className="text-sm font-medium text-destructive">{errors['telefone']}</div> : null}
    </main>
  );
}