import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, Inbox, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarPanel, type CategoryActionResult } from "@/components/app-sidebar";
import { DemandDialog } from "@/components/demand-dialog";
import { AiDemandDialog } from "@/components/ai-demand-dialog";
import { KanbanBoard, type KanbanGroupBy } from "@/components/kanban/kanban-board";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-categories";
import {
  useClearAllDemands,
  useCreateDemand,
  useDeleteDemand,
  useDemands,
  useMoveDemand,
  useUpdateDemand,
  useUpdatePriority,
  type DemandInput,
} from "@/hooks/use-demands";
import { filterDemands } from "@/lib/demands";
import { PRIORITIES, VIEWS } from "@/types/doapp";
import type { ListDoapp, PriorityLevel, TaskStatus, ViewKey } from "@/types/doapp";

import { BoardHeader } from "./BoardHeader";

interface DialogState {
  open: boolean;
  demand: ListDoapp | null;
  status?: TaskStatus;
  priority?: PriorityLevel;
}

const CLOSED_DIALOG: DialogState = { open: false, demand: null };

function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((column) => (
        <div
          key={column}
          className="flex h-full w-[288px] shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyBoard({ onCreate, onOpenAi }: { onCreate: () => void; onOpenAi: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <Inbox className="size-10 text-muted-foreground/40" />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
          {t("empty.title", "Seu quadro de demandas está limpo e pronto!")}
        </h2>
        <p className="max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
          {t(
            "empty.desc",
            "A base foi limpa para você lançar os casos reais de trabalho hoje. Cole prints com Ctrl+V no botão de IA ou cadastre manualmente.",
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
          onClick={onOpenAi}
        >
          <Sparkles className="size-4" />
          {t("empty.addWithAi", "Adicionar com IA")}
        </Button>
        <Button type="button" onClick={onCreate}>
          {t("empty.newTask", "Nova Tarefa")}
        </Button>
      </div>
    </div>
  );
}

const Board = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [groupBy, setGroupByState] = useState<KanbanGroupBy>(() => {
    if (typeof window === "undefined") return "status";
    return (localStorage.getItem("rpsec_task.groupby") as KanbanGroupBy) || "status";
  });

  const setGroupBy = (mode: KanbanGroupBy) => {
    setGroupByState(mode);
    try {
      localStorage.setItem("rpsec_task.groupby", mode);
    } catch {
      // Ignora erro de storage
    }
  };

  const view = useMemo<ViewKey>(() => {
    const requested = searchParams.get("view");
    return VIEWS.some((option) => option.value === requested)
      ? (requested as ViewKey)
      : "all";
  }, [searchParams]);

  const activeCategoryId = useMemo<number | "all">(() => {
    const requested = searchParams.get("category");
    const parsed = Number(requested);
    return requested && Number.isFinite(parsed) ? parsed : "all";
  }, [searchParams]);

  const search = searchParams.get("q") ?? "";

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ListDoapp | null>(null);

  const { demands, isPending } = useDemands(user?.id ?? null);
  const { categories } = useCategories();
  const { createDemand } = useCreateDemand(user?.id ?? null);
  const { updateDemand } = useUpdateDemand();
  const { moveDemand } = useMoveDemand();
  const { updatePriority } = useUpdatePriority();
  const { clearAllDemands } = useClearAllDemands();
  const { deleteDemand } = useDeleteDemand();
  const { createCategory } = useCreateCategory();
  const { deleteCategory } = useDeleteCategory();

  const now = new Date();

  const counts = useMemo(() => {
    const views: Record<ViewKey, number> = {
      all: demands.length,
      daily: 0,
      weekly: 0,
      monthly: 0,
      long_term: 0,
    };
    const byCategory: Record<number, number> = {};

    demands.forEach((demand) => {
      views[demand.horizon] += 1;
      byCategory[demand.category_id] = (byCategory[demand.category_id] ?? 0) + 1;
    });

    return { views, categories: byCategory };
  }, [demands]);

  const visibleDemands = useMemo(
    () =>
      filterDemands(demands, {
        view,
        categoryId: activeCategoryId,
        search,
      }),
    [demands, view, activeCategoryId, search],
  );

  const activeCategory =
    activeCategoryId === "all"
      ? null
      : categories.find((category) => category.id === activeCategoryId) ?? null;

  const viewLabel = useMemo(() => {
    switch (view) {
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
        return t("sidebar.all", "Todas as demandas");
    }
  }, [view, t]);

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const openCreate = (status?: TaskStatus, priority?: PriorityLevel) =>
    setDialog({ open: true, demand: null, status, priority });

  const handleDialogSubmit = async (input: DemandInput) => {
    if (dialog.demand) {
      await updateDemand({ id: dialog.demand.id, input });
      toast.success("Demanda atualizada");
      return;
    }

    await createDemand(input);
    toast.success("Demanda adicionada ao quadro");
  };

  const handleMove = (demand: ListDoapp, status: TaskStatus) => {
    void moveDemand({ id: demand.id, status });
    toast.success(`Status alterado`);
  };

  const handleUpdatePriority = (demand: ListDoapp, priority: PriorityLevel) => {
    void updatePriority({ id: demand.id, priority });
    const pInfo = PRIORITIES.find((p) => p.value === priority);
    toast.success(`Prioridade alterada: ${pInfo?.icon ?? ""} ${pInfo?.label ?? priority}`);
  };

  const handleClearAllDemands = async () => {
    await clearAllDemands();
    toast.success("Quadro limpo com sucesso! Base pronta para novos casos reais.");
  };

  const requestDelete = (demand: ListDoapp) => {
    setDialog(CLOSED_DIALOG);
    setPendingDelete(demand);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteDemand(pendingDelete.id);
    setPendingDelete(null);
    toast.success("Demanda excluída");
  };

  const handleCreateCategory = async (name: string): Promise<CategoryActionResult> => {
    const result = await createCategory(name);
    if (result.ok) toast.success(`"${name.trim()}" adicionada`);
    else if (result.error) toast.error(result.error);
    return result;
  };

  const handleDeleteCategory = async (id: number): Promise<CategoryActionResult> => {
    const result = await deleteCategory(id);
    if (!result.ok && result.error) toast.error(result.error);
    else if (result.ok) {
      if (activeCategoryId === id) updateParams({ category: null });
      toast.success("Categoria excluída");
    }
    return result;
  };

  const sidebarProps = {
    categories,
    counts,
    activeView: view,
    activeCategoryId,
    userName: user?.name ?? "",
    onSelectView: (nextView: ViewKey) =>
      updateParams({ view: nextView === "all" ? null : nextView }),
    onSelectCategory: (categoryId: number | "all") =>
      updateParams({ category: categoryId === "all" ? null : String(categoryId) }),
    onCreateCategory: handleCreateCategory,
    onDeleteCategory: handleDeleteCategory,
    onLogout: () => {
      logout();
      navigate("/login", { replace: true });
    },
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden w-[264px] shrink-0 border-r border-sidebar-border md:block">
        <SidebarPanel {...sidebarProps} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navegação do quadro</SheetTitle>
          <SidebarPanel {...sidebarProps} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <BoardHeader
          title={viewLabel}
          category={activeCategory}
          search={search}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          onSearchChange={(value) => updateParams({ q: value })}
          onClearCategory={() => updateParams({ category: null })}
          onCreate={() => openCreate()}
          onOpenAi={() => setAiDialogOpen(true)}
          onOpenNav={() => setMobileNavOpen(true)}
          onClearAllDemands={handleClearAllDemands}
          totalDemandsCount={demands.length}
        />

        <div className="min-h-0 flex-1 px-4 py-4 md:px-6 md:py-6">
          {isPending ? (
            <BoardSkeleton />
          ) : demands.length === 0 ? (
            <EmptyBoard onCreate={() => openCreate()} onOpenAi={() => setAiDialogOpen(true)} />
          ) : (
            <KanbanBoard
              demands={visibleDemands}
              categories={categories}
              now={now}
              groupBy={groupBy}
              onQuickAdd={openCreate}
              onEdit={(demand) => setDialog({ open: true, demand })}
              onMove={handleMove}
              onUpdatePriority={handleUpdatePriority}
              onDelete={requestDelete}
            />
          )}
        </div>
      </main>

      <DemandDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog(open ? dialog : CLOSED_DIALOG)}
        demand={dialog.demand}
        defaultStatus={dialog.status}
        defaultPriority={dialog.priority}
        categories={categories}
        onSubmit={handleDialogSubmit}
        onDelete={requestDelete}
      />

      <AiDemandDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        categories={categories}
        onCreateDemand={createDemand}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta demanda?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.description} será removida do seu quadro. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Board;
