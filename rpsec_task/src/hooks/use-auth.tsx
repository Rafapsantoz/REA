import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, getCachedUser, clearAuth } from "@/lib/api";
import type { Users } from "@/types/doapp";

export type AuthResult =
  | { ok: true; user: Users }
  | { ok: false; error: string };

interface AuthContextValue {
  user: Users | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function BootstrapSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
      <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">Connecting to your board...</p>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Users | null>(() => getCachedUser());

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
      })
      .catch((error) => {
        console.error("Could not verify session with backend:", error);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const loggedUser = await authApi.login(email, password);
      setUser(loggedUser);
      return { ok: true, user: loggedUser };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in.";
      return { ok: false, error: message };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        const registeredUser = await authApi.register(name, email, password);
        setUser(registeredUser);
        return { ok: true, user: registeredUser };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to register account.";
        return { ok: false, error: message };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    authApi.logout().finally(() => {
      clearAuth();
      queryClient.clear();
      setUser(null);
    });
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  if (!ready) return <BootstrapSplash />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider.");
  return context;
}
