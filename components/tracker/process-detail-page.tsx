"use client";

import { CheckCircle2, Circle, RotateCw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useImportProcess } from "@/lib/api/hooks/use-import-processes";
import type { TrackerProcessForm } from "@/domain/tracker/process-form";
import type {
  ImportProcessApi,
  ImportProcessServiceStatus,
  ImportProcessServiceType,
  ImportProcessTagType,
  ImportProcessTaskStatus,
} from "@/lib/api/types/import-process-api";
import { cn } from "@/lib/utils";

type ProcessDetailPageProps = {
  processId: string;
};

const serviceLabels: Record<ImportProcessServiceType, string> = {
  customs_clearance: "Despacho Aduaneiro",
  international_freight: "Frete Internacional",
  international_insurance: "Seguro Internacional",
  road_freight: "Frete Rodoviário",
  advisory: "Assessoria",
  financial: "Financeiro",
};

const tagLabels: Record<ImportProcessTagType, string> = {
  dta: "DTA",
  dtc: "DTC",
  li_lpco: "LI/LPCO",
};

const taskStatusLabels: Record<ImportProcessTaskStatus, string> = {
  pending: "Pendente",
  active: "Em andamento",
  done: "Concluída",
  blocked: "Bloqueada",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function serviceTone(status: ImportProcessServiceStatus) {
  if (status === "completed") return "bg-success/15 text-success";
  if (status === "in_progress") return "bg-primary/15 text-primary";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
}

function clientName(process: ImportProcessApi) {
  return (
    process.client?.nome_resumido ??
    process.client?.razao_social ??
    process.client?.cnpj ??
    "Cliente não informado"
  );
}

function clientTaxId(process: ImportProcessApi) {
  return process.client?.cnpj ?? process.client?.tax_id ?? null;
}

function clientDocumentLabel(process: ImportProcessApi) {
  const taxId = clientTaxId(process);
  return `${clientName(process)}${taxId ? ` · ${taxId}` : ""}`;
}

function processTags(process: ImportProcessApi) {
  return process.tags.map((tag) => tag.tag_type);
}

function trackerMetadata(process: ImportProcessApi) {
  return process.metadata_json as
    | Partial<TrackerProcessForm>
    | null
    | undefined;
}

function joinValues(values?: string[]) {
  return values?.length ? values.join(", ") : "—";
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="min-h-10 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-xs">
        {value || "—"}
      </div>
    </div>
  );
}

function ReadOnlySwitch({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full border border-border transition-colors",
        checked ? "bg-success" : "bg-muted",
      )}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </span>
  );
}

function SectionCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/20"
    >
      <h2 className="mb-5 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ProcessTasks({ process }: { process: ImportProcessApi }) {
  const tasks = process.tasks.length
    ? process.tasks
    : [
        {
          id: "open-process",
          name: "Abertura de processo",
          status: "done" as const,
          service_type: "international_freight" as const,
        },
        {
          id: "document-check",
          name: "Conferência documental",
          status: "pending" as const,
          service_type: "customs_clearance" as const,
        },
        {
          id: "bl-check",
          name: "Conferência do BL",
          status: "pending" as const,
          service_type: "customs_clearance" as const,
        },
        {
          id: "cargo-insurance",
          name: "Averbar seguro da carga",
          status: "pending" as const,
          service_type: "international_insurance" as const,
        },
      ];

  const completed = tasks.filter((task) => task.status === "done").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/20">
      <div className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Pré-embarque · {completed}/{tasks.length} concluídas
      </div>
      <div className="space-y-3">
        {tasks.map((task) => {
          const done = task.status === "done";
          return (
            <Link
              key={task.id}
              href={`#task-${task.id}`}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {done ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1",
                  done && "text-muted-foreground line-through",
                )}
              >
                {task.name}
              </span>
              <Badge variant="secondary" className="rounded-full">
                {serviceLabels[task.service_type] ??
                  taskStatusLabels[task.status]}
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function OpeningData({ process }: { process: ImportProcessApi }) {
  const freightApproved = process.freight?.quote_status === "approved";

  return (
    <SectionCard id="dados-abertura" title="Dados da abertura">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadOnlyField
          label="Nº do processo"
          value={process.internal_reference ?? process.process_number}
        />
        <ReadOnlyField label="Ref. Siscasco" value={process.process_number} />
        <ReadOnlyField label="Ref. Cliente" value={process.client_reference} />
        <ReadOnlyField
          label="Data de abertura"
          value={formatDate(process.opened_at)}
        />
        <div className="lg:col-span-2">
          <ReadOnlyField label="Cliente" value={clientDocumentLabel(process)} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
        <span className="text-sm text-foreground">
          Cotação de frete aprovada
        </span>
        <ReadOnlySwitch checked={freightApproved} />
      </div>

      <div className="mt-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Serviços
        </div>
        <div className="flex flex-wrap gap-2">
          {process.services.map((service) => (
            <Badge
              key={service.id}
              variant="secondary"
              className={cn(
                "rounded-xl px-3 py-1",
                serviceTone(service.status),
              )}
            >
              {serviceLabels[service.service_type]}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Sinalizações
        </div>
        <div className="flex flex-wrap gap-2">
          {process.tags.length ? (
            process.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="rounded-xl px-3 py-1"
              >
                {tagLabels[tag.tag_type]}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhuma sinalização.
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function OperationData({ process }: { process: ImportProcessApi }) {
  const metadata = trackerMetadata(process);
  const operation = metadata?.operation;
  const scope = metadata?.scope;
  const rows = [
    ["Tipo de operação", joinValues(operation?.operationTypes)],
    ["Incoterm", operation?.incoterm || "—"],
    [
      "Modal",
      operation?.modal ||
        (process.shipments[0]?.vessel_name ? "MARITIMO" : "—"),
    ],
    ["Carga perigosa", scope?.dangerousCargo || "—"],
    [
      "Regime especial",
      scope?.specialRegimeType || scope?.specialRegime || "—",
    ],
    [
      "Drawback",
      scope?.drawback ||
        (processTags(process).includes("li_lpco") ? "A verificar" : "Não"),
    ],
    ["Finalidade", operation?.purposeDescription || operation?.purpose || "—"],
  ];

  return (
    <SectionCard id="operacao" title="Operação">
      <div className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-6 py-3"
          >
            <span className="text-sm text-foreground">{label}</span>
            <span className="text-right text-sm text-muted-foreground">
              {value}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ProcessFlags({ process }: { process: ImportProcessApi }) {
  const flags: { key: ImportProcessTagType; label: string }[] = [
    { key: "dta", label: "DTA?" },
    { key: "dtc", label: "DTC?" },
    { key: "li_lpco", label: "LI/LPCO?" },
  ];

  return (
    <SectionCard id="sinalizadores" title="Sinalizadores do processo">
      <div className="space-y-4">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-sm text-foreground">{flag.label}</span>
            <ReadOnlySwitch checked={processTags(process).includes(flag.key)} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">EX Tarifário?</span>
          <ReadOnlySwitch checked={false} />
        </div>
      </div>
    </SectionCard>
  );
}

export function ProcessDetailPage({ processId }: ProcessDetailPageProps) {
  const { data: process, error, isLoading } = useImportProcess(processId);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <RotateCw className="size-5 animate-spin" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-destructive">
        Não foi possível carregar as informações do processo.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-background p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Informações do processo
          </div>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {process.process_number}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {clientName(process)}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {formatDate(process.opened_at)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">
          <div className="space-y-5">
            <ProcessTasks process={process} />
            <ProcessFlags process={process} />
          </div>
          <div className="space-y-5">
            <OpeningData process={process} />
            <OperationData process={process} />
          </div>
        </div>
      </div>
    </div>
  );
}
