"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import CompletenessBadge from "@/components/ui/completeness-badge";
import {
  PageHeader,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  Toolbar,
} from "@/components/ui/form-layout";
import { TextInput, Select } from "@/components/ui/form-fields";
import { useScopes } from "@/lib/api/hooks/use-scope-api";

type StatusFilter = "todos" | "draft" | "published" | "archived";

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [q, setQ] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;


  const params = useMemo(
    () => ({
      status: status === "todos" ? undefined : status,
      q: q || undefined,
      cnpj: cnpj || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [cnpj, page, q, status]
  );

  const { data, error, isLoading } = useScopes(params);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageShell>
      <PageHeader
        title="Dashboard de Escopos"
        subtitle="Acompanhe rascunhos, publicações e completude do formulário."
        right={
          <Link href="/scopes/new">
            <PrimaryButton>Novo Escopo</PrimaryButton>
          </Link>
        }
      />

      <Card>
        <Toolbar
          left={
            <>
              <div style={{ minWidth: 180 }}>
                <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                  <option value="todos">Todos</option>
                  <option value="draft">Draft</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </Select>
              </div>

              <div style={{ minWidth: 280 }}>
                <TextInput
                  placeholder="Buscar por razão social ou CNPJ"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>

              <div style={{ minWidth: 180 }}>
                <TextInput
                  placeholder="CNPJ exato"
                  value={cnpj}
                  onChange={(e) => { setCnpj(e.target.value); setPage(1); }}
                />
              </div>
            </>
          }
        />
      </Card>

      <div style={{ height: 16 }} />

      <Card padded={false}>
        {isLoading ? (
          <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <RotateCw className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div style={{ padding: 20 }}>Falha ao carregar dados.</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 20 }}>Nenhum escopo encontrado.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={thStyle}>CNPJ</th>
                  <th style={thStyle}>Razão Social</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Completude</th>
                  <th style={thStyle}>Atualizado em</th>
                  <th style={thStyle}>Últ. publicação</th>
                  <th style={thStyle}>Versões</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td style={tdStyle}>{x.cnpj}</td>
                    <td style={tdStyle}>{x.razao_social}</td>
                    <td style={tdStyle}>{x.status}</td>
                    <td style={tdStyle}><CompletenessBadge value={x.completeness_score} /></td>
                    <td style={tdStyle}>{new Date(x.updated_at).toLocaleString("pt-BR")}</td>
                    <td style={tdStyle}>{x.last_published_at ? new Date(x.last_published_at).toLocaleString("pt-BR") : "-"}</td>
                    <td style={tdStyle}>{x.version_count}</td>
                    <td style={tdStyle}>
                      <Link href={x.status === "published" ? `/clients/${x.cnpj}/scopes/view/${x.id}` : `/scopes/${x.id}`}>
                        <SecondaryButton>{x.status === "published" ? "Visualizar" : "Abrir"}</SecondaryButton>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ height: 16 }} />

      <Toolbar
        left={
          <SecondaryButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Anterior
          </SecondaryButton>
        }
        right={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>Página {page} de {totalPages} — Total: {total}</span>
            <SecondaryButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Próxima
            </SecondaryButton>
          </div>
        }
      />
    </PageShell>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  borderBottom: "1px solid #eaecf0",
  color: "#344054",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #eaecf0",
  color: "#101828",
};
