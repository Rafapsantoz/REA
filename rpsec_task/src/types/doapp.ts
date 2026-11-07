/**
 * Types mirror the `appdb` schema of the existing Postgres database 1:1
 * (tables `users`, `categories_doapp`, `list_doapp`) so the storage layer can be
 * swapped for the Django/Postgres backend later without touching the UI.
 */

export type TaskStatus = "pending" | "in_progress" | "done";

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

/** Table `list_doapp` + the `horizon` column that drives the four views. */
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
}

export interface DoappDatabase {
  version: 1;
  users: Users[];
  categories_doapp: CategoriesDoapp[];
  list_doapp: ListDoapp[];
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const HORIZONS: { value: Horizon; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "long_term", label: "Long-term" },
];

export const VIEWS: { value: ViewKey; label: string }[] = [
  { value: "all", label: "All demands" },
  ...HORIZONS,
];
