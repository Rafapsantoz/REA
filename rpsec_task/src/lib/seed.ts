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

export const DEMO_MOCK_KEYWORDS = [
  "OAuth token expiration",
  "landing page hero",
  "Q1 financial report",
  "Data-Intensive Applications",
  "Quarterly tax preparation",
];

/**
 * Seeds the starter account and categories with an EMPTY demands list
 * so the user starts with a clean board for real work today.
 */
export async function ensureSeeded(): Promise<void> {
  const database = readDatabase();

  // Se houver resquícios dos mocks antigos em inglês, remove automaticamente
  if (database.list_doapp.some((d) => DEMO_MOCK_KEYWORDS.some((kw) => d.description.includes(kw)))) {
    const cleaned = database.list_doapp.filter(
      (d) => !DEMO_MOCK_KEYWORDS.some((kw) => d.description.includes(kw))
    );
    writeDatabase({ ...database, list_doapp: cleaned });
  }

  if (hasSeeded()) return;

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
      fg_logged: false,
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

  markSeeded();
}
