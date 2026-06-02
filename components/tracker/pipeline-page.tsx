"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Grid2X2,
  LayoutPanelTop,
  List,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="sticky left-0 top-0 z-20 flex h-[60px] min-w-[1180px] shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl border-2 border-[#173b61] text-[#173b61] shadow-sm">
          <Columns3 className="size-5" />
        </div>
        <h1 className="text-xl font-semibold text-[#071120]">
          Rastreador de Processo
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-10 gap-2 bg-card text-base font-normal"
        >
          <SlidersHorizontal className="size-4" />
          Filtros
        </Button>

        <div className="flex overflow-hidden rounded-lg border border-border bg-card">
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
                  "flex size-10 items-center justify-center border-r border-border text-[#5d6f8a] transition-colors last:border-r-0 hover:bg-secondary",
                  active && "bg-[#173b61] text-white hover:bg-[#173b61]",
                )}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>

        <Button className="h-11 bg-[#173b61] px-5 text-white hover:bg-[#173b61]/90">
          <Plus className="size-5" />
          Novo Processo
        </Button>
        <span className="whitespace-nowrap text-base text-[#536681]">
          {total} processos
        </span>
      </div>
    </div>
  );
}

function PipelineCard({ process }: { process: ImportProcess }) {
  return (
    <article className="rounded-b-xl rounded-t-md border-t-[5px] border-[#91a4be] bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <strong className="text-base text-[#071120]">
          {process.processNumber}
        </strong>
        <Badge
          variant="secondary"
          className="rounded-full bg-secondary text-xs font-medium text-[#536681]"
        >
          {statusLabel(process)}
        </Badge>
      </div>
      <p className="text-sm font-medium uppercase text-[#536681]">
        {process.client.name}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm text-[#071120]">
        <span>ETD {formatShortDate(processEtd(process))}</span>
        <span>ETA {formatShortDate(processEta(process))}</span>
      </div>
    </article>
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
          <section key={stage} className="min-w-[260px]">
            <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.12em] text-[#536681]">
              {label}
            </h2>
            <div className="space-y-3">
              {columnProcesses.length ? (
                columnProcesses.map((process) => (
                  <PipelineCard key={process.id} process={process} />
                ))
              ) : (
                <div className="pt-10 text-center text-sm text-[#536681]">
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
  return (
    <div className="min-w-[1280px]">
      <Table>
        <TableHeader className="bg-secondary/70">
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
                className="h-10 px-4 text-xs font-semibold text-[#536681]"
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
            <TableRow key={process.id} className="h-[54px]">
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
      <div className="sticky left-0 flex h-14 items-center justify-between border-t border-border px-4 text-sm text-[#536681]">
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
    <div className="min-w-[1320px]">
      <div className="sticky left-0 flex h-14 items-center justify-between border-b border-border bg-secondary/30 px-4">
        <label className="flex items-center gap-3 text-sm text-[#536681]">
          Agrupar:
          <select className="h-9 w-[200px] rounded-md border border-border bg-card px-3 text-[#071120]">
            <option>Por ETA</option>
          </select>
        </label>
        <span className="text-sm text-[#536681]">
          {etaProcesses.length} processos com ETA
        </span>
      </div>
      <div className="relative h-[340px] border-b border-border bg-secondary/20 px-20 pt-4">
        <div className="mb-7 grid grid-cols-8 text-center text-xs font-medium uppercase text-[#536681]">
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
              <div className="h-10 border-l border-[#173b61]" />
              <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                <strong>{process.processNumber}</strong>
                <p className="text-xs text-[#536681]">
                  ETA {formatShortDate(processEta(process))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupedView({ processes }: { processes: ImportProcess[] }) {
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
    <div className="min-w-[1180px] p-4">
      <div className="sticky left-0 mb-8 flex items-center gap-3 text-sm text-[#536681]">
        Agrupar por:
        <select
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          className="h-9 w-[225px] rounded-md border border-border bg-card px-3 text-[#071120]"
        >
          <option value="client">Cliente</option>
          <option value="eta">ETA</option>
        </select>
      </div>
      <div className="space-y-4">
        {Object.entries(groups).map(([group, groupProcesses]) => (
          <section
            key={group}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="flex h-11 items-center justify-between border-b border-border bg-card px-4">
              <h2 className="flex items-center gap-2 font-semibold text-[#071120]">
                <ChevronDown className="size-4" />
                {group}
              </h2>
              <span className="text-sm text-[#536681]">
                {groupProcesses.length} proc
              </span>
            </div>
            {groupProcesses.map((process) => (
              <div
                key={process.id}
                className="grid grid-cols-[140px_1fr_1fr_1fr_120px] items-center border-b border-border px-4 py-3 last:border-b-0"
              >
                <strong>{process.processNumber}</strong>
                <span>{stageLabels[process.currentStage]}</span>
                <span className="text-[#536681]">{stoppedSector(process)}</span>
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#f4f7fb]">
      <div className="h-full min-h-0 w-full overflow-x-auto overflow-y-auto">
        <Header view={view} onViewChange={setView} total={processes.length} />

        {isLoading ? (
          <div className="sticky left-0 p-6 text-sm text-[#536681]">
            Carregando processos...
          </div>
        ) : error ? (
          <div className="sticky left-0 p-6 text-sm text-destructive">
            Não foi possível carregar os processos.
          </div>
        ) : processes.length === 0 ? (
          <div className="sticky left-0 p-6 text-sm text-[#536681]">
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
