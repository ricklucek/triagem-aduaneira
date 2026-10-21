"use client";

import { EscopoForm } from "@/domain/scope/types";
import { Field, TextInput } from "@/components/ui/form-fields";
import {
  Card,
  DangerButton,
  Grid,
  PrimaryButton,
  Stack,
  Toolbar,
} from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepContatos({ form, errors, onChange }: Props) {
  function updateContato(
    index: number,
    patch: Partial<(typeof form.contatos)[number]>,
  ) {
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
      <p className="text-sm text-muted-foreground">
        Todos os campos são opcionais. Deixe em branco o que não tiver
        disponível.
      </p>
      <Toolbar
        right={
          <PrimaryButton type="button" onClick={addContato}>
            + Adicionar contato
          </PrimaryButton>
        }
      />

      <Stack gap={12}>
        {form.contatos.map((contato, index) => (
          <Card key={index}>
            <Toolbar
              left={<strong>Contato {index + 1}</strong>}
              right={
                <DangerButton
                  type="button"
                  onClick={() => removeContato(index)}
                >
                  Remover
                </DangerButton>
              }
            />

            <Grid columns={2}>
              <Field label="Nome" error={errors[`contatos.${index}.nome`]}>
                <TextInput
                  name={`contatos.${index}.nome`}
                  invalid={Boolean(errors[`contatos.${index}.nome`])}
                  value={contato.nome}
                  onChange={(e) =>
                    updateContato(index, { nome: e.target.value })
                  }
                />
              </Field>

              <Field
                label="Cargo/Departamento"
                error={errors[`contatos.${index}.cargoDepartamento`]}
              >
                <TextInput
                  name={`contatos.${index}.cargoDepartamento`}
                  invalid={Boolean(
                    errors[`contatos.${index}.cargoDepartamento`],
                  )}
                  value={contato.cargoDepartamento}
                  onChange={(e) =>
                    updateContato(index, { cargoDepartamento: e.target.value })
                  }
                />
              </Field>

              <Field
                label="E-mail"
                hint="Se não tiver um e-mail válido, deixe em branco."
                error={errors[`contatos.${index}.email`]}
              >
                <TextInput
                  type="email"
                  name={`contatos.${index}.email`}
                  invalid={Boolean(errors[`contatos.${index}.email`])}
                  value={contato.email}
                  onChange={(e) =>
                    updateContato(index, { email: e.target.value })
                  }
                />
              </Field>

              <Field
                label="Telefone"
                error={errors[`contatos.${index}.telefone`]}
              >
                <TextInput
                  name={`contatos.${index}.telefone`}
                  invalid={Boolean(errors[`contatos.${index}.telefone`])}
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

      {form.contatos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum contato adicionado.
        </p>
      ) : null}

      {errors["contatos"] ? (
        <div className="text-sm font-medium text-destructive">
          {errors["contatos"]}
        </div>
      ) : null}
    </main>
  );
}
