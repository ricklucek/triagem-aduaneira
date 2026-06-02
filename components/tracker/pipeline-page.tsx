"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Grid2X2,
  LayoutPanelTop,
  List,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportProcesses } from "@/lib/api/hooks/use-import-processes";
import type {
  ImportProcess,
  ImportProcessStage,
  ServiceType,
} from "@/lib/api/types/import-process-api";
import { cn } from "@/lib/utils";

type PipelineView = "kanban" | "list" | "timeline" | "grouped";
type GroupBy = "client" | "eta";

const stageLabels: Record<ImportProcessStage, string> = {
  pre_shipment: "Pré-Embarque",
  shipment_in_transit: "Embarque e Trânsito",
  customs_clearance: "Chegada e Alfândega",
  released_for_delivery: "Liberação e Entrega",
};

const stages = Object.entries(stageLabels) as [ImportProcessStage, string][];

const serviceLabels: Record<ServiceType, string> = {
  customs_clearance: "Desembaraço Aduaneiro",
  international_freight: "Frete Internacional",
  international_insurance: "Seguro Internacional",
  road_freight: "Frete Rodoviário",
  advisory: "Consultoria",
  financial: "Financeiro",
};

const viewOptions: {
  value: PipelineView;
  label: string;
  icon: typeof Grid2X2;
}[] = [
  { value: "kanban", label: "Kanban", icon: Grid2X2 },
  { value: "list", label: "Lista", icon: List },
  { value: "timeline", label: "Timeline", icon: CalendarDays },
  { value: "grouped", label: "Agrupado", icon: LayoutPanelTop },
];

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

function formatShortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function processEta(process: ImportProcess) {
  return (
    process.shipment?.estimatedArrivalAt ?? process.dates.estimatedArrivalAt
  );
}

function processEtd(process: ImportProcess) {
  return (
    process.shipment?.estimatedDepartureAt ?? process.dates.estimatedDepartureAt
  );
}

function stoppedSector(process: ImportProcess) {
  const activeTask = process.tasks.find(
    (task) => task.status === "active" || task.status === "blocked",
  );
  const service =
    process.services.find((item) => item.status === "in_progress") ??
    process.services[0];
  return activeTask
    ? serviceLabels[activeTask.serviceType]
    : service
      ? serviceLabels[service.type]
      : "—";
}

function daysToEta(process: ImportProcess) {
  const eta = processEta(process);
  if (!eta) return "—";
  const etaDate = new Date(eta);
  if (Number.isNaN(etaDate.getTime())) return "—";
  const diff = Math.ceil(
    (etaDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Hoje";
  return `${diff}d`;
}

function statusLabel(process: ImportProcess) {
  return processEta(process) ? stageLabels[process.currentStage] : "Sem ETA";
}

function tagLabel(tag: string) {
  return tag.replace("_", "/").toUpperCase();
}

function Header({
  view,
  onViewChange,
  total,
}: {
  view: PipelineView;
  onViewChange: (view: PipelineView) => void;
  total: number;
}) {
  return (
    <div className="sticky left-0 top-0 z-20 flex min-w-[1180px] justify-end border-b border-border bg-background/80 p-2 backdrop-blur-sm md:p-4">
      <div className="flex items-center gap-3">
        <div className="flex overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const active = option.value === view;
            return (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={active}
                onClick={() => onViewChange(option.value)}
                className={cn(
                  "flex size-10 items-center justify-center border-r border-border text-muted-foreground transition-colors last:border-r-0 hover:bg-muted hover:text-foreground",
                  active &&
                    "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                )}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>

        <span className="whitespace-nowrap rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
          {total} processos
        </span>
      </div>
    </div>
  );
}

function PipelineCard({ process }: { process: ImportProcess }) {
  return (
    <Link
      href={`/tracker/process/${process.id}`}
      className="block rounded-2xl border border-border border-t-[5px] border-t-primary/60 bg-background p-4 shadow-sm shadow-black/20 transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <strong className="text-base text-foreground">
          {process.processNumber}
        </strong>
        <Badge
          variant="secondary"
          className="rounded-full bg-secondary text-xs font-medium text-muted-foreground"
        >
          {statusLabel(process)}
        </Badge>
      </div>
      <p className="text-sm font-medium uppercase text-muted-foreground">
        {process.client.name}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm text-foreground">
        <span>ETD {formatShortDate(processEtd(process))}</span>
        <span>ETA {formatShortDate(processEta(process))}</span>
      </div>
    </Link>
  );
}

function KanbanView({ processes }: { processes: ImportProcess[] }) {
  return (
    <div className="grid min-w-[1180px] grid-cols-4 gap-4 p-4">
      {stages.map(([stage, label]) => {
        const columnProcesses = processes.filter(
          (process) => process.currentStage === stage,
        );
        return (
          <section
            key={stage}
            className="min-w-[260px] rounded-2xl border border-border bg-card/70 p-3 shadow-sm"
          >
            <h2 className="mb-4 rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </h2>
            <div className="space-y-3">
              {columnProcesses.length ? (
                columnProcesses.map((process) => (
                  <PipelineCard key={process.id} process={process} />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/60 py-10 text-center text-sm text-muted-foreground">
                  Nenhum processo
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ListView({ processes }: { processes: ImportProcess[] }) {
  const router = useRouter();

  return (
    <div className="min-w-[1280px] bg-card/40">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            {[
              "SISCASCO",
              "CLIENTE",
              "FASE ATUAL",
              "SETOR PARADO",
              "RESPONSÁVEL",
              "ETD",
              "ETA",
              "DIAS P/ ETA",
              "ETIQUETAS",
              "STATUS",
            ].map((header) => (
              <TableHead
                key={header}
                className="h-10 px-4 text-xs font-semibold text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1">
                  {header}
                  <ChevronsUpDown className="size-3" />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-card">
          {processes.map((process) => (
            <TableRow
              key={process.id}
              className="h-[54px] cursor-pointer odd:bg-card even:bg-muted/20 hover:bg-muted/40"
              onClick={() => router.push(`/tracker/process/${process.id}`)}
            >
              <TableCell className="px-4 font-medium">
                {process.processNumber}
              </TableCell>
              <TableCell className="px-4">{process.client.name}</TableCell>
              <TableCell className="px-4">
                {stageLabels[process.currentStage]}
              </TableCell>
              <TableCell className="px-4">{stoppedSector(process)}</TableCell>
              <TableCell className="px-4">
                {process.freight.providerName ?? "—"}
              </TableCell>
              <TableCell className="px-4">
                {formatDate(processEtd(process))}
              </TableCell>
              <TableCell className="px-4">
                {formatDate(processEta(process))}
              </TableCell>
              <TableCell className="px-4">{daysToEta(process)}</TableCell>
              <TableCell className="px-4">
                <div className="flex gap-1">
                  {process.tags.length
                    ? process.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tagLabel(tag)}
                        </Badge>
                      ))
                    : "—"}
                </div>
              </TableCell>
              <TableCell className="px-4">
                <Badge variant="secondary" className="rounded-full">
                  {statusLabel(process)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="sticky left-0 flex h-14 items-center justify-between border-t border-border px-4 text-sm text-muted-foreground">
        <span>
          1–{processes.length} de {processes.length}
        </span>
        <span>
          Por página&nbsp;&nbsp;25&nbsp;&nbsp;‹&nbsp;&nbsp;1 / 1&nbsp;&nbsp;›
        </span>
      </div>
    </div>
  );
}

function TimelineView({ processes }: { processes: ImportProcess[] }) {
  const etaProcesses = processes.filter((process) => processEta(process));
  const firstEta = etaProcesses[0]
    ? new Date(processEta(etaProcesses[0])!)
    : new Date();
  const ticks = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(firstEta);
    date.setDate(firstEta.getDate() + index * 5);
    return date;
  });

  return (
    <div className="min-w-[1320px] bg-card/40">
      <div className="sticky left-0 flex h-14 items-center justify-between border-b border-border bg-muted/50 px-4">
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          Agrupar:
          <select className="h-9 w-[200px] rounded-md border border-border bg-card px-3 text-foreground">
            <option>Por ETA</option>
          </select>
        </label>
        <span className="text-sm text-muted-foreground">
          {etaProcesses.length} processos com ETA
        </span>
      </div>
      <div className="relative h-[340px] border-b border-border bg-card/70 px-20 pt-4">
        <div className="mb-7 grid grid-cols-8 text-center text-xs font-medium uppercase text-muted-foreground">
          {ticks.map((tick, index) => (
            <span key={tick.toISOString()}>
              {index === 0
                ? tick.toLocaleString("pt-BR", { month: "short" })
                : formatShortDate(tick.toISOString())}
            </span>
          ))}
        </div>
        <div className="h-px bg-border" />
        <div className="relative h-48">
          {etaProcesses.map((process, index) => (
            <div
              key={process.id}
              className="absolute top-10"
              style={{ left: `${8 + (index % 7) * 12}%` }}
            >
              <div className="h-10 border-l border-primary" />
              <Link
                href={`/tracker/process/${process.id}`}
                className="block rounded-xl border border-border bg-background px-3 py-2 shadow-sm shadow-black/20 transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <strong>{process.processNumber}</strong>
                <p className="text-xs text-muted-foreground">
                  ETA {formatShortDate(processEta(process))}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupedView({ processes }: { processes: ImportProcess[] }) {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>("client");
  const groups = useMemo(() => {
    return processes.reduce<Record<string, ImportProcess[]>>((acc, process) => {
      const key =
        groupBy === "client"
          ? process.client.name
          : formatDate(processEta(process));
      acc[key] = [...(acc[key] ?? []), process];
      return acc;
    }, {});
  }, [groupBy, processes]);

  return (
    <div className="min-w-[1180px] bg-card/40 p-4">
      <div className="sticky left-0 mb-8 flex items-center gap-3 text-sm text-muted-foreground">
        Agrupar por:
        <select
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          className="h-9 w-[225px] rounded-md border border-border bg-card px-3 text-foreground"
        >
          <option value="client">Cliente</option>
          <option value="eta">ETA</option>
        </select>
      </div>
      <div className="space-y-4">
        {Object.entries(groups).map(([group, groupProcesses]) => (
          <section
            key={group}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/20"
          >
            <div className="flex h-11 items-center justify-between border-b border-border bg-muted/40 px-4">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <ChevronDown className="size-4" />
                {group}
              </h2>
              <span className="text-sm text-muted-foreground">
                {groupProcesses.length} proc
              </span>
            </div>
            {groupProcesses.map((process) => (
              <div
                key={process.id}
                className="grid cursor-pointer grid-cols-[140px_1fr_1fr_1fr_120px] items-center border-b border-border px-4 py-3 transition-colors last:border-b-0 odd:bg-background even:bg-muted/20 hover:bg-muted/40"
                onClick={() => router.push(`/tracker/process/${process.id}`)}
              >
                <strong>{process.processNumber}</strong>
                <span>{stageLabels[process.currentStage]}</span>
                <span className="text-muted-foreground">
                  {stoppedSector(process)}
                </span>
                <span>{formatDate(processEta(process))}</span>
                <Badge
                  variant="secondary"
                  className="justify-self-end rounded-full"
                >
                  {statusLabel(process)}
                </Badge>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function TrackerPipelinePage() {
  const [view, setView] = useState<PipelineView>("kanban");
  const { data: processes = [], error, isLoading } = useImportProcesses();

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
      <div className="h-full min-h-0 w-full overflow-x-auto overflow-y-auto">
        <Header view={view} onViewChange={setView} total={processes.length} />

        {isLoading ? (
          <div className="sticky left-0 flex h-40 items-center justify-center p-6 text-muted-foreground">
            <RotateCw className="size-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="sticky left-0 p-6 text-sm text-destructive">
            Não foi possível carregar os processos.
          </div>
        ) : processes.length === 0 ? (
          <div className="sticky left-0 p-6 text-sm text-muted-foreground">
            Nenhum processo encontrado.
          </div>
        ) : view === "kanban" ? (
          <KanbanView processes={processes} />
        ) : view === "list" ? (
          <ListView processes={processes} />
        ) : view === "timeline" ? (
          <TimelineView processes={processes} />
        ) : (
          <GroupedView processes={processes} />
        )}
      </div>
    </div>
  );
}
