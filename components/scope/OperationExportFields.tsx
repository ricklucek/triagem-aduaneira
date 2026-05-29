"use client";

import type { OperationDraft } from "@/domain/scope/schema";

import { Card } from "@/components/ui/form-layout";

import OperationNcmSection from "./OperationNcmSection";

type OperationNcm = OperationDraft["ncms"][number];

type OperationExportFieldsProps = {
  operation: OperationDraft;
  patchOperation: (patch: Partial<OperationDraft>) => void;
  errors: Record<string, string>;
  prefix: string;
};

export default function OperationExportFields({
  operation,
  patchOperation,
  errors,
  prefix,
}: OperationExportFieldsProps) {
  return (
    <Card>
      <h3 className="text-base font-semibold">NCM e benefícios da exportação</h3>
      <OperationNcmSection
        ncms={operation.ncms ?? []}
        ncmNotes={operation.ncmNotes}
        onChangeNcms={(next: OperationNcm[]) => patchOperation({ ncms: next })}
        onChangeNotes={(next) => patchOperation({ ncmNotes: next })}
        error={errors[`${prefix}.ncms`]}
      />
    </Card>
  );
}
