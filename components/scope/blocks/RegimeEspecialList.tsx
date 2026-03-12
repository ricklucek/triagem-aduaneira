"use client";

import { Field, NumberInput, TextInput } from "@/components/ui/form-fields";
import {
  Card,
  DangerButton,
  Grid,
  PrimaryButton,
  Stack,
  Toolbar,
} from "@/components/ui/form-layout";

type Item = {
  nomeRegime: string;
  valor: number | null;
};

export default function RegimeEspecialList({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (next: Item[]) => void;
}) {
  function addItem() {
    onChange([...items, { nomeRegime: "", valor: null }]);
  }

  function updateItem(index: number, patch: Partial<Item>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <Toolbar
        left={<h3 style={{ margin: 0 }}>Regime Especial</h3>}
        right={
          <PrimaryButton type="button" onClick={addItem}>
            + Adicionar regime especial
          </PrimaryButton>
        }
      />

      <Stack gap={12}>
        {items.map((item, index) => (
          <Card key={index}>
            <Grid columns={2}>
              <Field label="Nome do Regime" required>
                <TextInput
                  value={item.nomeRegime}
                  onChange={(e) =>
                    updateItem(index, { nomeRegime: e.target.value })
                  }
                />
              </Field>

              <Field label="Valor" required>
                <NumberInput
                  value={item.valor ?? ""}
                  onChange={(e) =>
                    updateItem(index, { valor: Number(e.target.value) })
                  }
                />
              </Field>
            </Grid>

            <div style={{ marginTop: 12 }}>
              <DangerButton type="button" onClick={() => removeItem(index)}>
                Remover
              </DangerButton>
            </div>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}