"use client";

import { ScopeVersion } from "@/data/scope/ScopeRepo";
import { Card, Stack } from "@/components/ui/form-layout";

export default function VersionHistory({ versions }: { versions: ScopeVersion[] }) {
  if (versions.length === 0) {
    return (
      <Card>
        <h3 style={{ marginTop: 0 }}>Histórico de versões</h3>
        <p style={{ marginBottom: 0, color: "#667085" }}>
          Nenhuma versão publicada ainda.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Histórico de versões</h3>
      <Stack gap={12}>
        {versions.map((version) => (
          <div
            key={version.version_number}
            style={{
              border: "1px solid #eaecf0",
              borderRadius: 12,
              padding: 12,
              background: "#fcfcfd",
            }}
          >
            <div style={{ fontWeight: 700 }}>Versão {version.version_number}</div>
            <div style={{ color: "#667085", fontSize: 14 }}>
              Publicada em {new Date(version.published_at).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </Stack>
    </Card>
  );
}