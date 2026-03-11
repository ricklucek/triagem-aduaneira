"use client";

import { ToggleHeader } from "@/components/ui/form-fields";
import { Card, Divider, Stack } from "@/components/ui/form-layout";
import React from "react";

export default function ServicoToggleCard({
  title,
  checked,
  onToggle,
  children,
}: {
  title: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <ToggleHeader title={title} checked={checked} onChange={onToggle} />
      {checked ? (
        <>
          <Divider />
          <Stack>{children}</Stack>
        </>
      ) : null}
    </Card>
  );
}