"use client";

import { ScopeVersion } from "@/data/scope/ScopeRepo";
import { Card, Stack } from "@/components/ui/form-layout";

export default function VersionHistory({
  versions,
}: {
  versions: ScopeVersion[];
}) {
  if (versions.length === 0) {
    return (
      <Card>
        <h3 className="font-semibold">Versões</h3>
        <p className="text-muted-foreground">Nenhuma versão publicada ainda.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-semibold">Versões</h3>
      <Stack gap={12}>
        {versions.map((version) => (
          <div
            key={version.version_number}
            className="rounded-xl border border-border bg-muted/40 p-3"
          >
            <div style={{ fontWeight: 700 }}>
              Versão {version.version_number}
            </div>
            <div className="text-sm text-muted-foreground">
              Publicada em{" "}
              {new Date(version.published_at).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </Stack>
    </Card>
  );
}
