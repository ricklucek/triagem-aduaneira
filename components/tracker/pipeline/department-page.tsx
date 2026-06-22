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
import { useDepartmentBoardProcesses } from "@/lib/api/hooks/use-import-processes";
import type {
  ImportProcessApi,
  ImportProcessStage,
  ImportProcessServiceType,
} from "@/lib/api/types/import-process-api";
import { cn } from "@/lib/utils";

type PipelineView = "kanban" | "list" | "timeline" | "grouped";
type GroupBy = "client" | "eta";
type DepartmentType =
  | "customs_clearance"
  | "international_freight"
  | "international_insurance"
  | "road_freight"
  | "financial";

type DepartmentColumn = {
  key: string;
  label: string;
  taskKeys?: string[];
  stages?: ImportProcessStage[];
  fallback?: boolean;
};

const stageLabels: Record<ImportProcessStage, string> = {
  pre_shipment: "Pré-Embarque",
  shipment_in_transit: "Embarque e Trânsito",
  customs_clearance: "Chegada e Alfândega",
  released_for_delivery: "Liberação e Entrega",
};

const stages = Object.entries(stageLabels) as [ImportProcessStage, string][];

const serviceLabels: Record<ImportProcessServiceType, string> = {
  customs_clearance: "Desembaraço Aduaneiro",
  international_freight: "Frete Internacional",
  international_insurance: "Seguro Internacional",
  road_freight: "Frete Rodoviário",
  advisory: "Consultoria",
  financial: "Financeiro",
};

const departmentConfigs: Record<
  DepartmentType,
  { title: string; columns: DepartmentColumn[] }
> = {
  customs_clearance: {
    title: "Despacho Aduaneiro",
    columns: stages.map(([stage, label]) => ({
      key: stage,
      label,
      stages: [stage],
    })),
  },
  international_freight: {
    title: "Frete Internacional",
    columns: [
      {
        key: "process_opening",
        label: "Abertura de Processo",
        taskKeys: ["process_opening", "abertura_de_processo"],
        fallback: true,
      },
      { key: "booking", label: "Booking", taskKeys: ["booking"] },
      {
        key: "shipment_confirmation",
        label: "Confirmação de Embarque",
        taskKeys: ["shipment_confirmation", "confirmacao_de_embarque"],
      },
      {
        key: "agent_carrier_follow_up",
        label: "Follow Agente / Armador",
        taskKeys: [
          "agent_carrier_follow_up",
          "follow_agent_carrier",
          "follow_agente_armador",
        ],
      },
    ],
  },
  international_insurance: {
    title: "Seguro Internacional",
    columns: [
      {
        key: "insurance_registration",
        label: "Averbar Seguro",
        taskKeys: ["insurance_registration", "averbar_seguro"],
        fallback: true,
      },
      {
        key: "claim_check",
        label: "Verificar Avarias",
        taskKeys: ["claim_check", "verificar_avarias"],
      },
    ],
  },
  road_freight: {
    title: "Frete Rodoviário",
    columns: [
      {
        key: "receipt_scheduling",
        label: "Recebimento e Agendamento",
        taskKeys: ["receipt_scheduling", "recebimento_e_agendamento"],
        fallback: true,
      },
      { key: "pickup", label: "Coleta", taskKeys: ["pickup", "coleta"] },
      { key: "delivery", label: "Entrega", taskKeys: ["delivery", "entrega"] },
      {
        key: "container_return",
        label: "Devolução do Container",
        taskKeys: ["container_return", "devolucao_do_container"],
      },
    ],
  },
  financial: {
    title: "Financeiro",
    columns: [
      {
        key: "billing_in_progress",
        label: "Em Processo de Faturamento",
        taskKeys: ["billing_in_progress", "em_processo_de_faturamento"],
        fallback: true,
      },
      { key: "billed", label: "Faturado", taskKeys: ["billed", "faturado"] },
      {
        key: "closed_process",
        label: "Processo Encerrado",
        taskKeys: ["closed_process", "processo_encerrado"],
      },
    ],
  },
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

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function clientName(process: ImportProcessApi) {
  return (
    process.client?.nome_resumido ??
    process.client?.razao_social ??
    process.client?.cnpj ??
    "Cliente não informado"
  );
}

function processEta(process: ImportProcessApi) {
  return process.shipments[0]?.estimated_arrival_at ?? undefined;
}

function processEtd(process: ImportProcessApi) {
  return process.shipments[0]?.estimated_departure_at ?? undefined;
}

function stoppedSector(process: ImportProcessApi) {
  const activeTask = process.tasks.find(
    (task) => task.status === "active" || task.status === "blocked",
  );
  const service =
    process.services.find((item) => item.status === "in_progress") ??
    process.services[0];
  return activeTask
    ? serviceLabels[activeTask.service_type]
    : service
      ? serviceLabels[service.service_type]
      : "—";
}

function daysToEta(process: ImportProcessApi) {
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

function statusLabel(process: ImportProcessApi) {
  return processEta(process) ? stageLabels[process.current_stage] : "Sem ETA";
}

function tagLabel(tag: string) {
  return tag.replace("_", "/").toUpperCase();
}

function activeDepartmentTask(
  process: ImportProcessApi,
  department: DepartmentType,
) {
  const departmentTasks = process.tasks.filter(
    (task) => task.service_type === department,
  );

  return (
    departmentTasks.find(
      (task) => task.status === "active" || task.status === "blocked",
    ) ??
    departmentTasks.find((task) => task.status === "pending") ??
    departmentTasks.find((task) => task.status === "done") ??
    null
  );
}

function processMatchesColumn(
  process: ImportProcessApi,
  department: DepartmentType,
  column: DepartmentColumn,
) {
  if (column.stages?.includes(process.current_stage)) return true;

  const task = activeDepartmentTask(process, department);
  if (!task) return false;

  return column.taskKeys?.includes(task.task_key) ?? false;
}

function processesForColumn(
  processes: ImportProcessApi[],
  department: DepartmentType,
  column: DepartmentColumn,
  columns: DepartmentColumn[],
) {
  const matches = processes.filter((process) =>
    processMatchesColumn(process, department, column),
  );

  if (!column.fallback) return matches;

  const matchedIds = new Set(
    columns
      .filter((item) => item.key !== column.key)
      .flatMap((item) =>
        processes
          .filter((process) => processMatchesColumn(process, department, item))
          .map((process) => process.id),
      ),
  );

  return processes.filter(
    (process) =>
      matches.some((item) => item.id === process.id) ||
      !matchedIds.has(process.id),
  );
}

function Header({
  view,
  onViewChange,
  title,
}: {
  view: PipelineView;
  onViewChange: (view: PipelineView) => void;
  title: string;
}) {
  return (
    <div className="sticky left-0 top-0 z-20 flex min-w-[1180px] items-center justify-between border-b border-border bg-background/95 px-6 py-2 backdrop-blur-sm">
      <h1 className="truncate text-xl font-semibold text-foreground">
        Rastreador de Processo — {title}
      </h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <List className="size-4 rotate-90" />
          Filtros
        </button>
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
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ process }: { process: ImportProcessApi }) {
  return (
    <Link
      href={`/tracker/process/${process.id}`}
      className="block rounded-lg border border-transparent border-t-[5px] border-t-primary/45 bg-background px-4 py-3 shadow-sm transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <strong className="text-base text-foreground">
          {process.process_number}
        </strong>
        <Badge
          variant="secondary"
          className="rounded-full bg-secondary text-xs font-medium text-muted-foreground"
        >
          {statusLabel(process)}
        </Badge>
      </div>
      <p className="text-sm font-medium uppercase text-muted-foreground">
        {clientName(process)}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>ETD {formatShortDate(processEtd(process))}</span>
        <span>ETA {formatShortDate(processEta(process))}</span>
      </div>
    </Link>
  );
}

function KanbanView({
  processes,
  department,
  columns,
}: {
  processes: ImportProcessApi[];
  department: DepartmentType;
  columns: DepartmentColumn[];
}) {
  return (
    <div
      className="grid min-w-[1180px] gap-4 bg-muted/40 px-5 py-6"
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(240px, 1fr))`,
      }}
    >
      {columns.map((column) => {
        const columnProcesses = processesForColumn(
          processes,
          department,
          column,
          columns,
        );
        return (
          <section key={column.key} className="min-w-[240px]">
            <h2 className="mb-5 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {column.label}
            </h2>
            <div className="space-y-3">
              {columnProcesses.length ? (
                columnProcesses.map((process) => (
                  <PipelineCard key={process.id} process={process} />
                ))
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
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

function ListView({ processes }: { processes: ImportProcessApi[] }) {
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
                {process.process_number}
              </TableCell>
              <TableCell className="px-4">{clientName(process)}</TableCell>
              <TableCell className="px-4">
                {stageLabels[process.current_stage]}
              </TableCell>
              <TableCell className="px-4">{stoppedSector(process)}</TableCell>
              <TableCell className="px-4">
                {process.freight?.provider_name ?? "—"}
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
                        <Badge key={tag.id} variant="secondary">
                          {tagLabel(tag.tag_type)}
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

function TimelineView({ processes }: { processes: ImportProcessApi[] }) {
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
                <strong>{process.process_number}</strong>
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

function GroupedView({ processes }: { processes: ImportProcessApi[] }) {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>("client");
  const groups = useMemo(() => {
    return processes.reduce<Record<string, ImportProcessApi[]>>(
      (acc, process) => {
        const key =
          groupBy === "client"
            ? clientName(process)
            : formatDate(processEta(process));
        acc[key] = [...(acc[key] ?? []), process];
        return acc;
      },
      {},
    );
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
                <strong>{process.process_number}</strong>
                <span>{stageLabels[process.current_stage]}</span>
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

export function DepartmentPipelinePage({
  department,
}: {
  department: DepartmentType;
}) {
  const [view, setView] = useState<PipelineView>("kanban");
  const { data, error, isLoading } = useDepartmentBoardProcesses(department);
  const config = departmentConfigs[department];

  const processes = data?.items ?? [];

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
      <div className="h-full min-h-0 w-full overflow-x-auto overflow-y-auto">
        <Header view={view} onViewChange={setView} title={config.title} />

        {isLoading ? (
          <div className="sticky left-0 flex h-40 items-center justify-center p-6 text-muted-foreground">
            <RotateCw className="size-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="sticky left-0 p-6 text-sm text-destructive">
            Não foi possível carregar os processos.
          </div>
        ) : view === "kanban" ? (
          <KanbanView
            processes={processes}
            department={department}
            columns={config.columns}
          />
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
