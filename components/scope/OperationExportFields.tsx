"use client";

import { useState } from "react";

import type { OperationDraft } from "@/domain/scope/schema";

import ServicoToggleCard from "./blocks/ServicoToggleCard";
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
  const [showNcms, setShowNcms] = useState(true);

  return (
    <ServicoToggleCard title="NCM e benefícios da exportação" checked={showNcms} onToggle={setShowNcms}>
      <OperationNcmSection
        ncms={operation.ncms ?? []}
        ncmNotes={operation.ncmNotes}
        onChangeNcms={(next: OperationNcm[]) => patchOperation({ ncms: next })}
        onChangeNotes={(next) => patchOperation({ ncmNotes: next })}
        error={errors[`${prefix}.ncms`]}
      />
    </ServicoToggleCard>
  );
}
