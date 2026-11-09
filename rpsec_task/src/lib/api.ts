import type {
  CategoriesDoapp,
  Horizon,
  ListDoapp,
  TaskStatus,
  Users,
} from "@/types/doapp";
import {
  readDatabase,
  writeDatabase,
  nextId,
  readSessionUserId,
  writeSession,
  clearSession,
} from "@/lib/local-db";
import { login as localLogin, register as localRegister } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000/api/v1";

const TOKEN_KEY = "doapp.token.v1";
const USER_KEY = "doapp.user.v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCachedUser(): Users | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Users;
  } catch {
    return null;
  }
}

export function setCachedUser(user: Users): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(2000), // Timeout rápido para fallback local
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson.detail === "string") {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson?.detail)) {
        errorDetail = errJson.detail.map((e: { msg?: string }) => e.msg).join(", ");
      }
    } catch {
      // Body is not JSON
    }
    throw new ApiError(errorDetail, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Users;
}

export const authApi = {
  async login(email: string, password: string): Promise<Users> {
    try {
      const data = await fetchApi<AuthResponse>("/auth/login-json", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      setCachedUser(data.user);
      return data.user;
    } catch {
      // Fallback local caso o backend esteja offline
      await ensureSeeded();
      const res = await localLogin(email, password);
      if (res.ok) {
        setToken("local-token");
        setCachedUser(res.user);
        writeSession(res.user.id);
        return res.user;
      }
      throw new ApiError(res.error, 400);
    }
  },

  async register(name: string, email: string, password: string): Promise<Users> {
    try {
      await fetchApi<Users>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      return authApi.login(email, password);
    } catch {
      await ensureSeeded();
      const res = await localRegister(name, email, password);
      if (res.ok) {
        setToken("local-token");
        setCachedUser(res.user);
        writeSession(res.user.id);
        return res.user;
      }
      throw new ApiError(res.error, 400);
    }
  },

  async me(): Promise<Users | null> {
    try {
      const token = getToken();
      if (!token) {
        // Se ainda não logou mas tem seed, restaura sessão demo
        await ensureSeeded();
        const sid = readSessionUserId();
        const db = readDatabase();
        const autoUser = db.users.find((u) => u.id === sid) || db.users[0] || null;
        if (autoUser) {
          setToken("local-token");
          setCachedUser(autoUser);
          return autoUser;
        }
        return null;
      }
      const user = await fetchApi<Users>("/auth/me");
      setCachedUser(user);
      return user;
    } catch {
      await ensureSeeded();
      const cached = getCachedUser();
      if (cached) return cached;
      const sid = readSessionUserId();
      const db = readDatabase();
      const found = db.users.find((u) => u.id === sid) || db.users[0] || null;
      if (found) {
        setToken("local-token");
        setCachedUser(found);
      }
      return found;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Ignora erro de rede no logout
    } finally {
      clearAuth();
      clearSession();
    }
  },
};

export const categoriesApi = {
  async list(): Promise<CategoriesDoapp[]> {
    try {
      return await fetchApi<CategoriesDoapp[]>("/categories/");
    } catch {
      await ensureSeeded();
      return readDatabase().categories_doapp;
    }
  },

  async create(description: string): Promise<CategoriesDoapp> {
    try {
      return await fetchApi<CategoriesDoapp>("/categories/", {
        method: "POST",
        body: JSON.stringify({ description }),
      });
    } catch {
      const db = readDatabase();
      const newCat: CategoriesDoapp = { id: nextId(db.categories_doapp), description };
      writeDatabase({ ...db, categories_doapp: [...db.categories_doapp, newCat] });
      return newCat;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await fetchApi(`/categories/${id}`, { method: "DELETE" });
    } catch {
      const db = readDatabase();
      writeDatabase({ ...db, categories_doapp: db.categories_doapp.filter((c) => c.id !== id) });
    }
  },
};

export interface DemandFilters {
  category_id?: number | "all";
  status?: TaskStatus;
  horizon?: Horizon | "all";
  search?: string;
}

export const demandsApi = {
  async list(filters?: DemandFilters): Promise<ListDoapp[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category_id && filters.category_id !== "all") {
        params.set("category_id", String(filters.category_id));
      }
      if (filters?.status) {
        params.set("status", filters.status);
      }
      if (filters?.horizon && filters.horizon !== "all") {
        params.set("horizon", filters.horizon);
      }
      if (filters?.search) {
        params.set("search", filters.search);
      }

      const query = params.toString() ? `?${params.toString()}` : "";
      return await fetchApi<ListDoapp[]>(`/demands/${query}`);
    } catch {
      await ensureSeeded();
      let list = readDatabase().list_doapp;
      if (filters?.category_id && filters.category_id !== "all") {
        list = list.filter((d) => d.category_id === Number(filters.category_id));
      }
      if (filters?.status) {
        list = list.filter((d) => d.status === filters.status);
      }
      if (filters?.horizon && filters.horizon !== "all") {
        list = list.filter((d) => d.horizon === filters.horizon);
      }
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        list = list.filter((d) => d.description.toLowerCase().includes(s));
      }
      return list;
    }
  },

  async create(
    demand: Omit<ListDoapp, "id" | "user_id" | "initial_dt">
  ): Promise<ListDoapp> {
    try {
      return await fetchApi<ListDoapp>("/demands/", {
        method: "POST",
        body: JSON.stringify(demand),
      });
    } catch {
      const db = readDatabase();
      const sessionUser = getCachedUser() || db.users[0];
      const newDemand: ListDoapp = {
        ...demand,
        id: nextId(db.list_doapp),
        user_id: sessionUser ? sessionUser.id : 1,
        initial_dt: new Date().toISOString(),
        link: demand.link ?? null,
      };
      writeDatabase({ ...db, list_doapp: [...db.list_doapp, newDemand] });
      return newDemand;
    }
  },

  async update(
    id: number,
    demand: Partial<Omit<ListDoapp, "id" | "user_id" | "initial_dt">>
  ): Promise<ListDoapp> {
    try {
      return await fetchApi<ListDoapp>(`/demands/${id}`, {
        method: "PUT",
        body: JSON.stringify(demand),
      });
    } catch {
      const db = readDatabase();
      let updated: ListDoapp | null = null;
      const list = db.list_doapp.map((d) => {
        if (d.id === id) {
          updated = { ...d, ...demand };
          return updated;
        }
        return d;
      });
      writeDatabase({ ...db, list_doapp: list });
      return updated ?? db.list_doapp.find((d) => d.id === id)!;
    }
  },

  async updateStatus(id: number, status: TaskStatus): Promise<ListDoapp> {
    try {
      return await fetchApi<ListDoapp>(`/demands/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      return demandsApi.update(id, { status });
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await fetchApi(`/demands/${id}`, { method: "DELETE" });
    } catch {
      const db = readDatabase();
      writeDatabase({ ...db, list_doapp: db.list_doapp.filter((d) => d.id !== id) });
    }
  },
};
