"use client";

import { Field, TextInput } from "@/components/ui/form-fields";
import {
  DangerButton,
  Grid,
  PrimaryButton,
  Stack,
  Toolbar,
} from "@/components/ui/form-layout";
import { formatNCM } from "@/utils/format";

export default function NcmListBlock({
  items,
  onChange,
  error,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  function addItem() {
    onChange([...items, ""]);
  }

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Toolbar
        right={
          <PrimaryButton type="button" onClick={addItem}>
            + Adicionar NCM
          </PrimaryButton>
        }
      />

      <Stack gap={12}>
        {items.map((item, index) => (
          <Grid key={index} columns={2}>
            <Field
              label={index === 0 ? "NCM principal" : `NCM ${index + 1}`}
              required
              error={index === 0 ? error : undefined}
            >
              <TextInput
                value={formatNCM(item)}
                onChange={(e) => updateItem(index, e.target.value)}
              />
            </Field>

            <div style={{ display: "flex", alignItems: "end" }}>
              {items.length > 1 ? (
                <DangerButton type="button" onClick={() => removeItem(index)}>
                  Remover
                </DangerButton>
              ) : null}
            </div>
          </Grid>
        ))}
      </Stack>
    </div>
  );
}
