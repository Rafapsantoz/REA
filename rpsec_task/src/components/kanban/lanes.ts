import { AlarmClock, CircleCheck, CircleDashed, Timer, type LucideIcon } from "lucide-react";

import type { LaneKey, TaskStatus } from "@/types/doapp";

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
    label: "Pending",
    status: "pending",
    emptyLabel: "Nothing waiting. You are all caught up.",
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
    label: "In Progress",
    status: "in_progress",
    emptyLabel: "Nothing in progress right now.",
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
    label: "Done",
    status: "done",
    emptyLabel: "Finished demands land here.",
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
    label: "Overdue",
    status: null,
    emptyLabel: "Nothing overdue. Nice.",
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

export const laneDropId = (lane: LaneKey) => `lane-${lane}`;

export const demandDragId = (demandId: number) => `demand-${demandId}`;

export function laneFromDropId(id: string | number | null | undefined): LaneKey | null {
  if (typeof id !== "string") return null;
  return LANES.find((lane) => laneDropId(lane.key) === id)?.key ?? null;
}

export function demandIdFromDragId(id: string | number): number | null {
  const parsed = Number(String(id).replace("demand-", ""));
  return Number.isFinite(parsed) ? parsed : null;
}
