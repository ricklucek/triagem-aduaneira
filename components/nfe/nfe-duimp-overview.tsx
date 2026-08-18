"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Download,
  FileJson,
  Globe2,
  MapPin,
  Package,
  Search,
  Ship,
  Weight,
} from "lucide-react";
import type { DuimpSnapshotDetail } from "@/lib/api/types/nfe-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function read(value: unknown, path: string[]) {
  let current = value;
  for (const key of path) current = asRecord(current)[key];
  return current;
}

function pick(value: unknown, ...paths: string[][]) {
  for (const path of paths) {
    const candidate = read(value, path);
    if (candidate !== null && candidate !== undefined && candidate !== "") {
      return candidate;
    }
  }
  return null;
}

function display(value: unknown, fallback = "Não informado") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

function dateLabel(value: unknown) {
  if (!value) return "Não informada";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function dateTimeLabel(value: unknown) {
  if (!value) return "Não informado";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function decimal(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = String(value).replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function money(value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(decimal(value));
}

function saveJson(value: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{display(value)}</dd>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function NfeDuimpOverview({
  snapshots,
}: {
  snapshots: DuimpSnapshotDetail[];
}) {
  const [itemQuery, setItemQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const snapshot = snapshots[0];

  const normalized = snapshot?.normalized_payload;
  const items = useMemo(
    () =>
      Array.isArray(normalized?.items) ? normalized.items.map(asRecord) : [],
    [normalized],
  );
  const supplier = asRecord(
    pick(normalized, ["foreign_supplier"], ["exporter"]),
  );
  const importer = asRecord(pick(normalized, ["importer"], ["declarant"]));
  const totals = asRecord(
    pick(normalized, ["totals"], ["tax_totals"], ["values"]),
  );
  const filteredItems = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [
        item.number,
        item.product_code,
        item.description,
        item.ncm,
        item.exporter_code,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [itemQuery, items]);

  if (!snapshot) {
    return (
      <Alert>
        <FileJson />
        <AlertTitle>DUIMP ainda não capturada</AlertTitle>
        <AlertDescription>
          A visualização será liberada depois que o Portal Único retornar o
          primeiro snapshot.
        </AlertDescription>
      </Alert>
    );
  }

  const rootExporterCode = pick(normalized, ["exporter_code"]);
  const exporters = new Map<string, number>();
  items.forEach((item) => {
    const code = display(
      item.exporter_code || rootExporterCode,
      "Não informado",
    );
    exporters.set(code, (exporters.get(code) || 0) + 1);
  });
  const totalCustomsValue = items.reduce(
    (sum, item) => sum + decimal(item.customs_value || item.product_value),
    0,
  );
  const maxPage = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>DUIMP {snapshot.duimp_number}</CardTitle>
                <Badge variant="secondary">
                  Versão{" "}
                  {snapshot.duimp_version || display(normalized.version, "1")}
                </Badge>
              </div>
              <CardDescription className="mt-2">
                Capturada em{" "}
                {dateTimeLabel(snapshot.fetched_at || snapshot.created_at)}
                {" · "}
                {display(snapshot.source_provider, "Portal Único")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  saveJson(
                    snapshot.normalized_payload,
                    "DUIMP-" + snapshot.duimp_number + "-normalizado.json",
                  )
                }
              >
                <Download /> Normalizado
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  saveJson(
                    snapshot.raw_payload,
                    "DUIMP-" + snapshot.duimp_number + "-original.json",
                  )
                }
              >
                <Download /> Original
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Data de registro"
            value={dateLabel(pick(normalized, ["registration_date"]))}
          />
          <Info
            label="Situação"
            value={pick(normalized, ["status"], ["situation"])}
          />
          <Info label="Itens" value={items.length} />
          <Info label="Exportadores" value={exporters.size || 1} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<Building2 className="size-5" />} title="Importador">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Razão social"
              value={pick(importer, ["legal_name"], ["name"], ["razao_social"])}
            />
            <Info label="CNPJ" value={pick(importer, ["cnpj"], ["tax_id"])} />
            <Info
              label="Modalidade da importação"
              value={pick(normalized, ["import_modality"])}
            />
            <Info
              label="Referência do processo"
              value={pick(normalized, ["reference_code"])}
            />
          </dl>
        </Section>

        <Section icon={<Globe2 className="size-5" />} title="Exportador">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Nome"
              value={pick(supplier, ["legal_name"], ["name"])}
            />
            <Info
              label="Código"
              value={
                pick(supplier, ["code"], ["exporter_code"]) || rootExporterCode
              }
            />
            <Info
              label="País"
              value={pick(supplier, ["country_name"], ["country", "name"])}
            />
            <Info
              label="Identificador estrangeiro"
              value={pick(supplier, ["foreign_id"], ["foreign_tax_id"])}
            />
          </dl>
        </Section>

        <Section
          icon={<MapPin className="size-5" />}
          title="Desembaraço aduaneiro"
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Local"
              value={pick(normalized, ["clearance_location"])}
            />
            <Info label="UF" value={pick(normalized, ["clearance_state"])} />
            <Info
              label="Data"
              value={dateLabel(pick(normalized, ["clearance_date"]))}
            />
            <Info
              label="Unidade"
              value={pick(normalized, ["clearance_unit"], ["customs_unit"])}
            />
          </dl>
        </Section>

        <Section icon={<Ship className="size-5" />} title="Transporte e carga">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info
              label="Via de transporte"
              value={pick(
                normalized,
                ["transport_mode_code"],
                ["transport", "mode"],
              )}
            />
            <Info
              label="Conhecimento/AWB"
              value={pick(normalized, ["transport_document"], ["awb"], ["ruc"])}
            />
            <Info
              label="Peso líquido"
              value={pick(normalized, ["net_weight"], ["cargo", "net_weight"])}
            />
            <Info
              label="Peso bruto"
              value={pick(
                normalized,
                ["gross_weight"],
                ["cargo", "gross_weight"],
              )}
            />
          </dl>
        </Section>
      </div>

      <Section
        icon={<CalendarDays className="size-5" />}
        title="Valores e tributos"
        description="Totais encontrados no snapshot normalizado; a conferência fiscal permanece obrigatória."
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Valor aduaneiro dos itens"
            value={money(totalCustomsValue)}
          />
          <Info
            label="Frete"
            value={money(pick(totals, ["freight"], ["freight_value"]))}
          />
          <Info
            label="Seguro"
            value={money(pick(totals, ["insurance"], ["insurance_value"]))}
          />
          <Info
            label="Imposto de importação"
            value={money(pick(totals, ["ii"], ["import_tax"]))}
          />
          <Info label="IPI" value={money(pick(totals, ["ipi"]))} />
          <Info label="PIS" value={money(pick(totals, ["pis"]))} />
          <Info label="COFINS" value={money(pick(totals, ["cofins"]))} />
          <Info
            label="ICMS de referência"
            value={money(pick(totals, ["icms"]))}
          />
        </dl>
      </Section>

      <Section
        icon={<Globe2 className="size-5" />}
        title="Distribuição por exportador"
        description="Esta informação será utilizada no planejamento Master/filhas do Checkpoint 3B."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(exporters.entries()).map(([code, count]) => (
            <div key={code} className="rounded-lg border p-3">
              <p className="font-medium">{code}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {count} item(ns)
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        icon={<Package className="size-5" />}
        title={"Itens da DUIMP (" + items.length + ")"}
        description="Pesquise por número, produto, descrição, NCM ou exportador."
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={itemQuery}
            onChange={(event) => {
              setItemQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Pesquisar nos itens"
            className="pl-9"
          />
        </div>
        <div className="space-y-3">
          {visibleItems.map((item, index) => (
            <div
              key={display(item.number, String(index))}
              className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(100px,.6fr))]"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <strong>Item {display(item.number)}</strong>
                  {Boolean(item.ncm) && (
                    <Badge variant="outline">NCM {display(item.ncm)}</Badge>
                  )}
                  {Boolean(item.exporter_code || rootExporterCode) && (
                    <Badge variant="outline">
                      Exportador{" "}
                      {display(item.exporter_code || rootExporterCode)}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {display(item.description || item.product_code)}
                </p>
              </div>
              <Info
                label="Quantidade"
                value={
                  display(item.quantity) +
                  " " +
                  display(item.commercial_unit || item.unit, "")
                }
              />
              <Info
                label="Valor do produto"
                value={money(item.product_value)}
              />
              <Info
                label="Valor aduaneiro"
                value={money(item.customs_value || item.product_value)}
              />
            </div>
          ))}
          {!visibleItems.length && (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum item encontrado para a pesquisa.
            </p>
          )}
        </div>
        {maxPage > 1 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {maxPage}
            </span>
            <Button
              variant="outline"
              disabled={page + 1 >= maxPage}
              onClick={() =>
                setPage((current) => Math.min(maxPage - 1, current + 1))
              }
            >
              Próxima
            </Button>
          </div>
        )}
      </Section>

      <Section
        icon={<FileJson className="size-5" />}
        title="Histórico e auditoria"
        description="Snapshots preservados da consulta ao Portal Único."
      >
        <div className="space-y-3">
          {snapshots.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Weight className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Snapshot {snapshots.length - index} · DUIMP{" "}
                    {item.duimp_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Capturado em{" "}
                    {dateTimeLabel(item.fetched_at || item.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    saveJson(
                      item.normalized_payload,
                      "DUIMP-" + item.duimp_number + "-normalizado.json",
                    )
                  }
                >
                  <Download /> Normalizado
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    saveJson(
                      item.raw_payload,
                      "DUIMP-" + item.duimp_number + "-original.json",
                    )
                  }
                >
                  <Download /> Original
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
