import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Check,
  Layers,
  LayoutGrid,
  LogOut,
  Plus,
  SquareKanban,
  Target,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { categoryDotClass } from "@/lib/category-colors";
import { VIEWS } from "@/types/doapp";
import type { CategoriesDoapp, ViewKey } from "@/types/doapp";

const VIEW_ICONS: Record<ViewKey, LucideIcon> = {
  all: LayoutGrid,
  daily: CalendarDays,
  weekly: CalendarRange,
  monthly: CalendarIcon,
  long_term: Target,
};

const ITEM_BASE =
  "group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none";
const ITEM_IDLE = "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const ITEM_ACTIVE =
  "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_hsl(var(--primary))]";

export interface SidebarCounts {
  views: Record<ViewKey, number>;
  categories: Record<number, number>;
}

export interface CategoryActionResult {
  ok: boolean;
  error?: string;
}

interface SidebarPanelProps {
  categories: CategoriesDoapp[];
  counts: SidebarCounts;
  activeView: ViewKey;
  activeCategoryId: number | "all";
  userName: string;
  onSelectView: (view: ViewKey) => void;
  onSelectCategory: (categoryId: number | "all") => void;
  onCreateCategory: (name: string) => Promise<CategoryActionResult>;
  onDeleteCategory: (categoryId: number) => Promise<CategoryActionResult>;
  onLogout: () => void;
  /** Called after a selection so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-medium tabular-nums",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

export function SidebarPanel({
  categories,
  counts,
  activeView,
  activeCategoryId,
  userName,
  onSelectView,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  onLogout,
  onNavigate,
}: SidebarPanelProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  const getViewLabel = (val: ViewKey) => {
    switch (val) {
      case "all":
        return t("sidebar.all", "Todas as demandas");
      case "daily":
        return t("sidebar.daily", "Hoje (Daily)");
      case "weekly":
        return t("sidebar.weekly", "Esta Semana (Weekly)");
      case "monthly":
        return t("sidebar.monthly", "Este Mês (Monthly)");
      case "long_term":
        return t("sidebar.longTerm", "Longo Prazo");
      default:
        return val;
    }
  };

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const handleCreate = async () => {
    const result = await onCreateCategory(draftName);
    if (result.ok) {
      setDraftName("");
      setIsAdding(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-brand text-brand-foreground">
          <SquareKanban className="size-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Momentum</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
        <p className="px-4 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t("sidebar.views", "VISUALIZAÇÕES")}
        </p>
        <nav className="flex flex-col gap-0.5 px-2">
          {VIEWS.map((view) => {
            const Icon = VIEW_ICONS[view.value];
            const active = activeView === view.value;
            return (
              <button
                key={view.value}
                type="button"
                aria-current={active ? "page" : undefined}
                className={cn(ITEM_BASE, active ? ITEM_ACTIVE : ITEM_IDLE)}
                onClick={() => {
                  onSelectView(view.value);
                  onNavigate?.();
                }}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{getViewLabel(view.value)}</span>
                <CountBadge count={counts.views[view.value]} active={active} />
              </button>
            );
          })}
        </nav>

        <p className="px-4 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t("sidebar.categories", "CATEGORIAS")}
        </p>
        <div className="flex flex-col gap-0.5 px-2">
          <button
            type="button"
            aria-current={activeCategoryId === "all" ? "page" : undefined}
            className={cn(
              ITEM_BASE,
              activeCategoryId === "all" ? ITEM_ACTIVE : ITEM_IDLE,
            )}
            onClick={() => {
              onSelectCategory("all");
              onNavigate?.();
            }}
          >
            <Layers className="size-4 shrink-0" />
            <span className="truncate">{t("sidebar.allCategories", "Todas as categorias")}</span>
            <CountBadge
              count={Object.values(counts.categories).reduce(
                (total, value) => total + value,
                0,
              )}
              active={activeCategoryId === "all"}
            />
          </button>

          {categories.map((category) => {
            const active = activeCategoryId === category.id;
            return (
              <div key={category.id} className="group relative">
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ITEM_BASE,
                    active ? ITEM_ACTIVE : ITEM_IDLE,
                    "pr-8",
                  )}
                  onClick={() => {
                    onSelectCategory(category.id);
                    onNavigate?.();
                  }}
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10",
                      categoryDotClass(category.id),
                    )}
                  />
                  <span className="truncate">{category.description}</span>
                  <CountBadge
                    count={counts.categories[category.id] ?? 0}
                    active={active}
                  />
                </button>
                <button
                  type="button"
                  aria-label={`Delete the ${category.description} category`}
                  className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-opacity duration-fast ease-standard hover:bg-background/70 hover:text-destructive focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring md:opacity-0 md:group-hover:opacity-100"
                  onClick={() => void onDeleteCategory(category.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}

          {isAdding ? (
            <div className="flex items-center gap-1 px-1 pt-1">
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleCreate();
                  if (event.key === "Escape") {
                    setIsAdding(false);
                    setDraftName("");
                  }
                }}
                placeholder={t("sidebar.categoryPlaceholder", "Nome da categoria")}
                aria-label={t("sidebar.categoryPlaceholder", "Nome da categoria")}
                className="h-8 w-full rounded-sm border border-input bg-background px-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              />
              <button
                type="button"
                aria-label="Salvar"
                onClick={() => void handleCreate()}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-primary hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Cancelar"
                onClick={() => {
                  setIsAdding(false);
                  setDraftName("");
                }}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="mt-0.5 flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors duration-fast ease-standard hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4" />
              {t("sidebar.newCategory", "Nova categoria")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-sidebar-border px-3 py-3">
        <span className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials || "?"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight">
          {userName}
        </span>
        <button
          type="button"
          aria-label={t("sidebar.signOut", "Sair")}
          onClick={onLogout}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
