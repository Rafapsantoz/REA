import type {
  CategoriesDoapp,
  DoappDatabase,
  ListDoapp,
  Users,
} from "@/types/doapp";

const STORAGE_KEY = "doapp.db.v1";
const SESSION_KEY = "doapp.session.v1";
const SEED_KEY = "doapp.seed.v1";

export function emptyDatabase(): DoappDatabase {
  return { version: 1, users: [], categories_doapp: [], list_doapp: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUser(value: unknown): value is Users {
  return isRecord(value) && typeof value.id === "number" && typeof value.email === "string";
}

function isCategory(value: unknown): value is CategoriesDoapp {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.description === "string"
  );
}

function isDemand(value: unknown): value is ListDoapp {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.description === "string" &&
    typeof value.category_id === "number" &&
    typeof value.user_id === "number"
  );
}

/**
 * Reads the database document. A missing, unreadable, or corrupted value falls
 * back to an empty database so the app stays usable instead of crashing.
 */
export function readDatabase(): DoappDatabase {
  if (typeof window === "undefined") return emptyDatabase();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDatabase();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyDatabase();

    return {
      version: 1,
      users: Array.isArray(parsed.users) ? parsed.users.filter(isUser) : [],
      categories_doapp: Array.isArray(parsed.categories_doapp)
        ? parsed.categories_doapp.filter(isCategory)
        : [],
      list_doapp: Array.isArray(parsed.list_doapp)
        ? parsed.list_doapp.filter(isDemand)
        : [],
    };
  } catch {
    return emptyDatabase();
  }
}

export function writeDatabase(database: DoappDatabase): DoappDatabase {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch (error) {
    console.error("Could not persist the local database.", error);
  }
  return database;
}

/** Reads, mutates, and persists the database document in one step. */
export function updateDatabase(
  mutate: (database: DoappDatabase) => DoappDatabase,
): DoappDatabase {
  return writeDatabase(mutate(readDatabase()));
}

export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

/* Session -------------------------------------------------------------- */

export function readSessionUserId(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.user_id !== "number") return null;
    return parsed.user_id;
  } catch {
    return null;
  }
}

export function writeSession(userId: number): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user_id: userId }));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

/* Seed flag ------------------------------------------------------------ */

export function hasSeeded(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SEED_KEY) === "done";
}

export function markSeeded(): void {
  window.localStorage.setItem(SEED_KEY, "done");
}
