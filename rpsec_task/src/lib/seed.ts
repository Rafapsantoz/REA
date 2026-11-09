import { hashPassword } from "@/lib/auth";
import {
  hasSeeded,
  markSeeded,
  nextId,
  readDatabase,
  writeDatabase,
  writeSession,
} from "@/lib/local-db";
import type { CategoriesDoapp, ListDoapp, Users } from "@/types/doapp";

export const DEMO_EMAIL = "demo@momentum.app";
export const DEMO_PASSWORD = "demo1234";

export const DEFAULT_CATEGORY_NAMES = ["Trabalho / Suporte", "Pessoal", "Financeiro"];

/**
 * Seeds the starter account and categories with an EMPTY demands list
 * so the user starts with a clean board for real work today.
 */
export async function ensureSeeded(): Promise<void> {
  if (hasSeeded()) return;

  const database = readDatabase();

  const demoUser: Users =
    database.users.find((user) => user.email === DEMO_EMAIL) ??
    ({
      id: nextId(database.users),
      name: "Rafael Santos",
      email: DEMO_EMAIL,
      password_hash: await hashPassword(DEMO_PASSWORD),
      register_dt: new Date().toISOString(),
      last_login: new Date().toISOString(),
      updated_dt: new Date().toISOString(),
      fg_logged: true,
    } satisfies Users);

  const categories: CategoriesDoapp[] =
    database.categories_doapp.length > 0
      ? database.categories_doapp
      : DEFAULT_CATEGORY_NAMES.map((description, index) => ({
          id: index + 1,
          description,
        }));

  // Base limpa para receber os casos reais de trabalho
  const demands: ListDoapp[] = [];

  writeDatabase({
    version: 1,
    users: database.users.length > 0 ? database.users : [demoUser],
    categories_doapp: categories,
    list_doapp: demands,
  });

  writeSession(demoUser.id);
  markSeeded();
}
