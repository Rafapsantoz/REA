import {
  clearSession,
  nextId,
  readDatabase,
  readSessionUserId,
  writeDatabase,
  writeSession,
} from "@/lib/local-db";
import type { Users } from "@/types/doapp";

export type AuthResult = { ok: true; user: Users } | { ok: false; error: string };

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return toHex(new Uint8Array(digest));
}

/**
 * Password hashing for the browser-only build. This keeps plaintext out of the
 * stored document, but it is not real server-side security: whoever opens the
 * browser can replace the stored document. It exists so the login flow is real
 * today and can be replaced by the Django/Postgres backend later.
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const usedSalt = salt ?? toHex(saltBytes);
  return `sha256$${usedSalt}$${await sha256Hex(`${usedSalt}:${password}`)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, salt, digest] = stored.split("$");
  if (algorithm !== "sha256" || !salt || !digest) return false;
  return (await sha256Hex(`${salt}:${password}`)) === digest;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const database = readDatabase();
  const normalized = normalizeEmail(email);

  if (database.users.some((user) => normalizeEmail(user.email) === normalized)) {
    return { ok: false, error: "Esse e-mail já está cadastrado. Tente fazer login ou use outro e-mail." };
  }

  const now = new Date().toISOString();
  const user: Users = {
    id: nextId(database.users),
    name: name.trim(),
    email: normalized,
    password_hash: await hashPassword(password),
    register_dt: now,
    last_login: now,
    updated_dt: now,
    fg_logged: true,
  };

  writeDatabase({ ...database, users: [...database.users, user] });
  writeSession(user.id);
  return { ok: true, user };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const database = readDatabase();
  const normalized = normalizeEmail(email);
  const user = database.users.find(
    (candidate) => normalizeEmail(candidate.email) === normalized,
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  const now = new Date().toISOString();
  const updated: Users = { ...user, last_login: now, updated_dt: now, fg_logged: true };
  writeDatabase({
    ...database,
    users: database.users.map((candidate) =>
      candidate.id === user.id ? updated : candidate,
    ),
  });
  writeSession(user.id);
  return { ok: true, user: updated };
}

export function logout(): void {
  const database = readDatabase();
  const userId = readSessionUserId();

  if (userId !== null) {
    writeDatabase({
      ...database,
      users: database.users.map((user) =>
        user.id === userId ? { ...user, fg_logged: false } : user,
      ),
    });
  }

  clearSession();
}

export function getCurrentUser(): Users | null {
  const userId = readSessionUserId();
  if (userId === null) return null;
  return readDatabase().users.find((user) => user.id === userId) ?? null;
}
