import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

/** Keeps the board behind the login page. */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
