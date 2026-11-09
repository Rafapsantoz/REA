import {
  AlarmClock,
  AlertTriangle,
  ArrowDownCircle,
  CircleCheck,
  CircleDashed,
  Clock,
  Flame,
  Timer,
  type LucideIcon,
} from "lucide-react";

import type { LaneKey, PriorityLevel, TaskStatus } from "@/types/doapp";

export interface LaneDefinition {
  key: LaneKey;
  label: string;
  /** Status written when a card is dropped here; null = derived lane, no drops. */
  status: TaskStatus | null;
  emptyLabel: string;
  icon: LucideIcon;
  /** Class strings are written out in full so Tailwind sees them while scanning. */
  style: {
    column: string;
    header: string;
    dot: string;
    title: string;
    badge: string;
    drop: string;
  };
}

export const LANES: LaneDefinition[] = [
  {
    key: "pending",
    label: "Pendente",
    status: "pending",
    emptyLabel: "Nada pendente. Tudo em dia!",
    icon: CircleDashed,
    style: {
      column: "",
      header: "bg-lane-pending-soft",
      dot: "bg-lane-pending",
      title: "text-lane-pending-foreground",
      badge: "bg-lane-pending/15 text-lane-pending-foreground",
      drop: "ring-2 ring-inset ring-lane-pending/35 bg-lane-pending-soft/60",
    },
  },
  {
    key: "in_progress",
    label: "Em Progresso",
    status: "in_progress",
    emptyLabel: "Nada em andamento no momento.",
    icon: Timer,
    style: {
      column: "",
      header: "bg-lane-progress-soft",
      dot: "bg-lane-progress",
      title: "text-lane-progress-foreground",
      badge: "bg-lane-progress/15 text-lane-progress-foreground",
      drop: "ring-2 ring-inset ring-lane-progress/35 bg-lane-progress-soft/60",
    },
  },
  {
    key: "done",
    label: "Concluído",
    status: "done",
    emptyLabel: "Demandas finalizadas caem aqui.",
    icon: CircleCheck,
    style: {
      column: "",
      header: "bg-lane-done-soft",
      dot: "bg-lane-done",
      title: "text-lane-done-foreground",
      badge: "bg-lane-done/15 text-lane-done-foreground",
      drop: "ring-2 ring-inset ring-lane-done/35 bg-lane-done-soft/60",
    },
  },
  {
    key: "overdue",
    label: "Atrasado",
    status: null,
    emptyLabel: "Nenhuma demanda atrasada. Excelente!",
    icon: AlarmClock,
    style: {
      column: "border-t-2 border-t-lane-overdue/60",
      header: "bg-lane-overdue-soft",
      dot: "bg-lane-overdue",
      title: "text-lane-overdue-foreground",
      badge: "bg-lane-overdue-emphasis text-lane-overdue-emphasis-foreground",
      drop: "",
    },
  },
];

export interface PriorityLaneDefinition {
  key: PriorityLevel;
  label: string;
  priority: PriorityLevel;
  emptyLabel: string;
  icon: LucideIcon;
  style: {
    column: string;
    header: string;
    dot: string;
    title: string;
    badge: string;
    drop: string;
  };
}

export const PRIORITY_LANES: PriorityLaneDefinition[] = [
  {
    key: "urgent",
    label: "Urgente (Hoje)",
    priority: "urgent",
    emptyLabel: "Nenhum chamado urgente pendente. Bom trabalho!",
    icon: Flame,
    style: {
      column: "border-t-2 border-t-rose-500",
      header: "bg-rose-500/10 dark:bg-rose-950/40",
      dot: "bg-rose-500 shadow-sm shadow-rose-500/50",
      title: "text-rose-600 dark:text-rose-400 font-bold",
      badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold",
      drop: "ring-2 ring-inset ring-rose-500/40 bg-rose-500/10",
    },
  },
  {
    key: "high",
    label: "Alta Prioridade",
    priority: "high",
    emptyLabel: "Nenhuma demanda com prioridade alta.",
    icon: AlertTriangle,
    style: {
      column: "border-t-2 border-t-amber-500",
      header: "bg-amber-500/10 dark:bg-amber-950/40",
      dot: "bg-amber-500 shadow-sm shadow-amber-500/50",
      title: "text-amber-600 dark:text-amber-400 font-semibold",
      badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold",
      drop: "ring-2 ring-inset ring-amber-500/40 bg-amber-500/10",
    },
  },
  {
    key: "normal",
    label: "Normal / Média",
    priority: "normal",
    emptyLabel: "Nenhuma demanda na fila normal.",
    icon: Clock,
    style: {
      column: "border-t-2 border-t-blue-500/60",
      header: "bg-blue-500/10 dark:bg-blue-950/40",
      dot: "bg-blue-500",
      title: "text-blue-600 dark:text-blue-400 font-medium",
      badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
      drop: "ring-2 ring-inset ring-blue-500/40 bg-blue-500/10",
    },
  },
  {
    key: "low",
    label: "Baixa / Standby",
    priority: "low",
    emptyLabel: "Nenhuma demanda em baixa prioridade.",
    icon: ArrowDownCircle,
    style: {
      column: "border-t-2 border-t-emerald-500/60",
      header: "bg-emerald-500/10 dark:bg-emerald-950/40",
      dot: "bg-emerald-500",
      title: "text-emerald-600 dark:text-emerald-400 font-medium",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      drop: "ring-2 ring-inset ring-emerald-500/40 bg-emerald-500/10",
    },
  },
];

export const laneDropId = (lane: LaneKey) => `lane-${lane}`;
export const priorityLaneDropId = (priority: PriorityLevel) => `priority-lane-${priority}`;

export const demandDragId = (demandId: number) => `demand-${demandId}`;

export function laneFromDropId(id: string | number | null | undefined): LaneKey | null {
  if (typeof id !== "string") return null;
  return LANES.find((lane) => laneDropId(lane.key) === id)?.key ?? null;
}

export function priorityFromDropId(id: string | number | null | undefined): PriorityLevel | null {
  if (typeof id !== "string") return null;
  return PRIORITY_LANES.find((lane) => priorityLaneDropId(lane.key) === id)?.key ?? null;
}

export function demandIdFromDragId(id: string | number): number | null {
  const parsed = Number(String(id).replace("demand-", ""));
  return Number.isFinite(parsed) ? parsed : null;
}
