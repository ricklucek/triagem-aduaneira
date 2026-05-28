"use client";

import { Field, TextArea } from "@/components/ui/form-fields";
import { Card, Grid } from "@/components/ui/form-layout";

export default function OperationExportFields({ operation }: any) {
  return (
    <Card>
      <h3 className="text-base font-semibold">Parâmetros de exportação</h3>
      <Grid columns={2}>
        <Field label="Descrição dos produtos">
          <TextArea value={operation.productsDescription ?? ""} readOnly />
        </Field>
        <Field label="Outro órgão anuente / observação">
          <TextArea value={operation.otherAuthority ?? ""} readOnly />
        </Field>
      </Grid>
    </Card>
  );
}
