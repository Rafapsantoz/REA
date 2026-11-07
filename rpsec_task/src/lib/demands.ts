import {
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  parseISO,
} from "date-fns";

import type { Horizon, LaneKey, ListDoapp, TaskStatus, ViewKey } from "@/types/doapp";

/** True when the deadline has passed and the demand is not finished yet. */
export function isOverdue(demand: ListDoapp, now: Date = new Date()): boolean {
  if (!demand.deadline || demand.status === "done") return false;
  return parseISO(demand.deadline).getTime() < now.getTime();
}

export function laneOf(demand: ListDoapp, now: Date = new Date()): LaneKey {
  return isOverdue(demand, now) ? "overdue" : demand.status;
}

/** The status a lane maps to; the derived overdue lane has no status of its own. */
export function statusOfLane(lane: LaneKey): TaskStatus | null {
  return lane === "overdue" ? null : lane;
}

export function laneCounts(
  demands: ListDoapp[],
  now: Date = new Date(),
): Record<LaneKey, number> {
  return demands.reduce<Record<LaneKey, number>>(
    (counts, demand) => {
      counts[laneOf(demand, now)] += 1;
      return counts;
    },
    { pending: 0, in_progress: 0, done: 0, overdue: 0 },
  );
}

/**
 * Pre-fills the horizon field from the deadline: today (or already late) is
 * daily, later this week is weekly, later this month is monthly, anything
 * further out - or without a deadline - is a long-term goal.
 */
export function suggestHorizon(
  deadline: string | null,
  now: Date = new Date(),
): Horizon {
  if (!deadline) return "long_term";

  const date = parseISO(deadline);
  if (Number.isNaN(date.getTime())) return "long_term";
  if (isSameDay(date, now) || date.getTime() < now.getTime()) return "daily";
  if (isSameWeek(date, now, { weekStartsOn: 1 })) return "weekly";
  if (isSameMonth(date, now)) return "monthly";
  return "long_term";
}

/** Compact relative label used on the board cards. */
export function describeDeadline(
  deadline: string | null,
  now: Date = new Date(),
): string | null {
  if (!deadline) return null;

  const date = parseISO(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const days = differenceInCalendarDays(date, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "1d overdue";
  if (days < -1) return `${Math.abs(days)}d overdue`;
  if (days < 7) return `in ${days}d`;

  return date.getFullYear() === now.getFullYear()
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");
}

export function compareDemands(a: ListDoapp, b: ListDoapp): number {
  const aTime = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
  const bTime = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
  if (aTime !== bTime) return aTime - bTime;
  return a.description.localeCompare(b.description);
}

export function matchesView(demand: ListDoapp, view: ViewKey): boolean {
  return view === "all" || demand.horizon === view;
}

export function matchesSearch(demand: ListDoapp, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    demand.description.toLowerCase().includes(term) ||
    (demand.link ?? "").toLowerCase().includes(term)
  );
}

export function filterDemands(
  demands: ListDoapp[],
  filters: { view: ViewKey; categoryId: number | "all"; search: string },
): ListDoapp[] {
  return demands
    .filter(
      (demand) =>
        matchesView(demand, filters.view) &&
        (filters.categoryId === "all" || demand.category_id === filters.categoryId) &&
        matchesSearch(demand, filters.search),
    )
    .sort(compareDemands);
}

/* Deadline input helpers (dialog) --------------------------------------- */

export function splitDeadline(deadline: string | null): { date?: Date; time: string } {
  if (!deadline) return { time: "23:59" };

  const parsed = parseISO(deadline);
  if (Number.isNaN(parsed.getTime())) return { time: "23:59" };

  return { date: parsed, time: format(parsed, "HH:mm") };
}

/** Combines a picked day and time into the stored ISO deadline. */
export function composeDeadline(date?: Date, time?: string): string | null {
  if (!date) return null;

  const [hours, minutes] = (time || "23:59").split(":").map((part) => Number(part));
  const combined = endOfDay(new Date(date));
  combined.setHours(
    Number.isFinite(hours) ? hours : 23,
    Number.isFinite(minutes) ? minutes : 59,
    0,
    0,
  );
  return combined.toISOString();
}
