"use client";

import { useId } from "react";
import { Field, TextInput } from "@/components/ui/form-fields";
import { Grid } from "@/components/ui/form-layout";

type Conta = {
  banco: string;
  agencia: string;
  conta: string;
};

export default function ContaBancariaBlock({
  title,
  value,
  onChange,
  errors = {},
  bancoOptions = [],
}: {
  title?: string;
  value: Conta;
  onChange: (next: Conta) => void;
  errors?: Record<string, string>;
  bancoOptions?: string[];
}) {
  const bancoListId = useId();

  return (
    <div>
      {title ? <h4 style={{ marginTop: 0 }}>{title}</h4> : null}
      <Grid columns={3}>
        <Field label="Banco" required error={errors["banco"]}>
          <TextInput
            value={value.banco}
            list={bancoOptions.length > 0 ? bancoListId : undefined}
            onChange={(e) => onChange({ ...value, banco: e.target.value })}
          />
          {bancoOptions.length > 0 ? (
            <datalist id={bancoListId}>
              {bancoOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          ) : null}
        </Field>

        <Field label="Agência" required error={errors["agencia"]}>
          <TextInput
            value={value.agencia}
            onChange={(e) => onChange({ ...value, agencia: e.target.value })}
          />
        </Field>

        <Field label="Conta" required error={errors["conta"]}>
          <TextInput
            value={value.conta}
            onChange={(e) => onChange({ ...value, conta: e.target.value })}
          />
        </Field>
      </Grid>
    </div>
  );
}
