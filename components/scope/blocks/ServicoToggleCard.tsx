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
    <Card className="overflow-hidden">
      <ToggleHeader title={title} checked={checked} onChange={onToggle} />

      <div
        className={[
          "grid transition-all duration-300 ease-in-out",
          checked
            ? "grid-rows-[1fr] opacity-100 mt-4"
            : "grid-rows-[0fr] opacity-0 mt-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <Divider />
          <Stack>{children}</Stack>
        </div>
      </div>
    </Card>
  );
}
