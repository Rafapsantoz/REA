/**
 * Types mirror the `appdb` schema of the existing Postgres database 1:1
 * (tables `users`, `categories_doapp`, `list_doapp`) so the storage layer can be
 * swapped for the Django/Postgres backend later without touching the UI.
 */

export type TaskStatus = "pending" | "in_progress" | "done";

export type PriorityLevel = "urgent" | "high" | "normal" | "low";

export type Horizon = "daily" | "weekly" | "monthly" | "long_term";

/**
 * Board column. `overdue` is derived (deadline passed and not done) and is never
 * stored in `list_doapp.status`.
 */
export type LaneKey = TaskStatus | "overdue";

/** Sidebar view filter: one of the time horizons, or every demand. */
export type ViewKey = "all" | Horizon;

/** Table `users`. `password` from the diagram is stored as a SHA-256 hash. */
export interface Users {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  register_dt: string;
  last_login: string | null;
  updated_dt: string;
  fg_logged: boolean;
}

/** Table `categories_doapp`. */
export interface CategoriesDoapp {
  id: number;
  description: string;
}

/** Table `list_doapp` + the `horizon` and `priority` columns. */
export interface ListDoapp {
  id: number;
  description: string;
  category_id: number;
  link: string | null;
  user_id: number;
  initial_dt: string;
  deadline: string | null;
  status: TaskStatus;
  horizon: Horizon;
  priority?: PriorityLevel;
}

export interface DoappDatabase {
  version: 1;
  users: Users[];
  categories_doapp: CategoriesDoapp[];
  list_doapp: ListDoapp[];
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em Progresso" },
  { value: "done", label: "Concluído" },
];

export const PRIORITIES: {
  value: PriorityLevel;
  label: string;
  icon: string;
  badgeClass: string;
}[] = [
  {
    value: "urgent",
    label: "Urgente",
    icon: "🚨",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  {
    value: "high",
    label: "Alta",
    icon: "⚡",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: "normal",
    label: "Normal",
    icon: "📌",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    value: "low",
    label: "Baixa",
    icon: "🟢",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
];

export const HORIZONS: { value: Horizon; label: string }[] = [
  { value: "daily", label: "Hoje (Daily)" },
  { value: "weekly", label: "Esta Semana (Weekly)" },
  { value: "monthly", label: "Este Mês (Monthly)" },
  { value: "long_term", label: "Longo Prazo" },
];

export const VIEWS: { value: ViewKey; label: string }[] = [
  { value: "all", label: "Todas as demandas" },
  ...HORIZONS,
];
