import type {
  CategoriesDoapp,
  Horizon,
  ListDoapp,
  TaskStatus,
  Users,
} from "@/types/doapp";

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
    const data = await fetchApi<AuthResponse>("/auth/login-json", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setCachedUser(data.user);
    return data.user;
  },

  async register(name: string, email: string, password: string): Promise<Users> {
    await fetchApi<Users>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    return authApi.login(email, password);
  },

  async me(): Promise<Users | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const user = await fetchApi<Users>("/auth/me");
      setCachedUser(user);
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
      }
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuth();
    }
  },
};

export const categoriesApi = {
  async list(): Promise<CategoriesDoapp[]> {
    return fetchApi<CategoriesDoapp[]>("/categories/");
  },

  async create(description: string): Promise<CategoriesDoapp> {
    return fetchApi<CategoriesDoapp>("/categories/", {
      method: "POST",
      body: JSON.stringify({ description }),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchApi(`/categories/${id}`, { method: "DELETE" });
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
    return fetchApi<ListDoapp[]>(`/demands/${query}`);
  },

  async create(
    demand: Omit<ListDoapp, "id" | "user_id" | "initial_dt">
  ): Promise<ListDoapp> {
    return fetchApi<ListDoapp>("/demands/", {
      method: "POST",
      body: JSON.stringify(demand),
    });
  },

  async update(
    id: number,
    demand: Partial<Omit<ListDoapp, "id" | "user_id" | "initial_dt">>
  ): Promise<ListDoapp> {
    return fetchApi<ListDoapp>(`/demands/${id}`, {
      method: "PUT",
      body: JSON.stringify(demand),
    });
  },

  async updateStatus(id: number, status: TaskStatus): Promise<ListDoapp> {
    return fetchApi<ListDoapp>(`/demands/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async delete(id: number): Promise<void> {
    await fetchApi(`/demands/${id}`, { method: "DELETE" });
  },
};
