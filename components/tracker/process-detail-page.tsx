"use client";

import { CheckCircle2, Circle, RotateCw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useImportProcess } from "@/lib/api/hooks/use-import-processes";
import type {
  ImportProcess,
  ImportProcessTagType,
  ServiceStatus,
  ServiceType,
  TaskStatus,
} from "@/lib/api/types/import-process-api";
import { cn } from "@/lib/utils";

type ProcessDetailPageProps = {
  processId: string;
};

const serviceLabels: Record<ServiceType, string> = {
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

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pendente",
  active: "Em andamento",
  done: "Concluída",
  blocked: "Bloqueada",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function serviceTone(status: ServiceStatus) {
  if (status === "completed") return "bg-success/15 text-success";
  if (status === "in_progress") return "bg-primary/15 text-primary";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
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

function ProcessTasks({ process }: { process: ImportProcess }) {
  const tasks = process.tasks.length
    ? process.tasks
    : [
        {
          id: "open-process",
          name: "Abertura de processo",
          status: "done" as const,
          serviceType: "international_freight" as const,
        },
        {
          id: "document-check",
          name: "Conferência documental",
          status: "pending" as const,
          serviceType: "customs_clearance" as const,
        },
        {
          id: "bl-check",
          name: "Conferência do BL",
          status: "pending" as const,
          serviceType: "customs_clearance" as const,
        },
        {
          id: "cargo-insurance",
          name: "Averbar seguro da carga",
          status: "pending" as const,
          serviceType: "international_insurance" as const,
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
                {serviceLabels[task.serviceType] ??
                  taskStatusLabels[task.status]}
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function OpeningData({ process }: { process: ImportProcess }) {
  const freightApproved = process.freight.quoteStatus === "approved";

  return (
    <SectionCard id="dados-abertura" title="Dados da abertura">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadOnlyField
          label="Nº do processo"
          value={process.internalReference ?? process.processNumber}
        />
        <ReadOnlyField label="Ref. Siscasco" value={process.processNumber} />
        <ReadOnlyField label="Ref. Cliente" value={process.clientReference} />
        <ReadOnlyField
          label="Data de abertura"
          value={formatDate(process.dates.openedAt)}
        />
        <div className="lg:col-span-2">
          <ReadOnlyField
            label="Cliente"
            value={`${process.client.name}${process.client.taxId ? ` · ${process.client.taxId}` : ""}`}
          />
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
              {serviceLabels[service.type]}
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
                key={tag}
                variant="outline"
                className="rounded-xl px-3 py-1"
              >
                {tagLabels[tag]}
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

function OperationData({ process }: { process: ImportProcess }) {
  const rows = [
    ["Tipo de operação", "Importação"],
    [
      "Incoterm",
      process.freight.internationalFreightResponsibility === "client"
        ? "Cliente"
        : "—",
    ],
    ["Modal", process.shipment?.vesselName ? "Marítimo" : "—"],
    ["Carga perigosa", "A confirmar"],
    ["Regime especial", "Nenhum"],
    ["Drawback", process.tags.includes("li_lpco") ? "A verificar" : "Não"],
    ["Finalidade", "Revenda"],
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

function ProcessFlags({ process }: { process: ImportProcess }) {
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
            <ReadOnlySwitch checked={process.tags.includes(flag.key)} />
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
                {process.processNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {process.client.name}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {formatDate(process.dates.openedAt)}
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
