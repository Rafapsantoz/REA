import { hashPassword } from "@/lib/auth";
import {
  hasSeeded,
  markSeeded,
  nextId,
  readDatabase,
  writeDatabase,
} from "@/lib/local-db";
import type { CategoriesDoapp, Horizon, ListDoapp, TaskStatus, Users } from "@/types/doapp";

export const DEMO_EMAIL = "demo@momentum.app";
export const DEMO_PASSWORD = "demo1234";

export const DEFAULT_CATEGORY_NAMES = ["Work", "Personal", "Financial"];

function deadlineAt(daysFromToday: number, time = "23:59"): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function exampleDemand(
  id: number,
  userId: number,
  categoryId: number,
  fields: {
    description: string;
    status: TaskStatus;
    horizon: Horizon;
    deadline: string | null;
    link?: string;
  },
): ListDoapp {
  const startedAt = new Date();
  startedAt.setDate(startedAt.getDate() - 1);

  return {
    id,
    description: fields.description,
    category_id: categoryId,
    link: fields.link ?? null,
    user_id: userId,
    initial_dt: startedAt.toISOString(),
    deadline: fields.deadline,
    status: fields.status,
    horizon: fields.horizon,
  };
}

/**
 * Seeds the demo account, the three starter categories, and a set of example
 * demands on first run only. Runs exactly once per browser (separate flag from
 * the data itself), so deleting rows later never re-creates them.
 */
export async function ensureSeeded(): Promise<void> {
  if (hasSeeded()) return;

  const database = readDatabase();

  const demoUser: Users =
    database.users.find((user) => user.email === DEMO_EMAIL) ??
    ({
      id: nextId(database.users),
      name: "Demo User",
      email: DEMO_EMAIL,
      password_hash: await hashPassword(DEMO_PASSWORD),
      register_dt: new Date().toISOString(),
      last_login: null,
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

  const [work, personal, financial] = categories;

  const demands: ListDoapp[] =
    database.list_doapp.length > 0
      ? database.list_doapp
      : [
          exampleDemand(1, demoUser.id, work.id, {
            description: "Ship the weekly report to the team",
            status: "pending",
            horizon: "daily",
            deadline: deadlineAt(0),
          }),
          exampleDemand(2, demoUser.id, work.id, {
            description: "Review the roadmap with the team",
            status: "in_progress",
            horizon: "weekly",
            deadline: deadlineAt(5),
            link: "https://docs.google.com",
          }),
          exampleDemand(3, demoUser.id, work.id, {
            description: "Plan next quarter's objectives",
            status: "pending",
            horizon: "long_term",
            deadline: deadlineAt(40),
          }),
          exampleDemand(4, demoUser.id, personal.id, {
            description: "Book the dentist appointment",
            status: "pending",
            horizon: "daily",
            deadline: deadlineAt(-2, "12:00"),
          }),
          exampleDemand(5, demoUser.id, personal.id, {
            description: "Read 30 pages of the current book",
            status: "in_progress",
            horizon: "weekly",
            deadline: deadlineAt(1),
          }),
          exampleDemand(6, demoUser.id, personal.id, {
            description: "Reach conversational Spanish",
            status: "pending",
            horizon: "long_term",
            deadline: null,
          }),
          exampleDemand(7, demoUser.id, financial.id, {
            description: "Pay the credit card invoice",
            status: "pending",
            horizon: "weekly",
            deadline: deadlineAt(3),
          }),
          exampleDemand(8, demoUser.id, financial.id, {
            description: "Review this month's budget",
            status: "done",
            horizon: "monthly",
            deadline: deadlineAt(12),
          }),
          exampleDemand(9, demoUser.id, financial.id, {
            description: "Build a 6-month emergency fund",
            status: "in_progress",
            horizon: "long_term",
            deadline: null,
          }),
        ];

  writeDatabase({
    version: 1,
    users:
      database.users.length > 0 ? database.users : [demoUser],
    categories_doapp: categories,
    list_doapp: demands,
  });
  markSeeded();
}
