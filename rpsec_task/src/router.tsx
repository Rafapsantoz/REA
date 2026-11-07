import { RouteGuard } from "./components/route-guard";
import Index from "./pages/Index";
import Board from "./pages/board";
import Login from "./pages/login";
import NotFound from "./pages/NotFound";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/board",
    name: "board",
    element: (
      <RouteGuard>
        <Board />
      </RouteGuard>
    ),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
