import { useState } from "react";
import { Columns3, Flame, Menu, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { categoryDotClass } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { CategoriesDoapp } from "@/types/doapp";
import type { KanbanGroupBy } from "@/components/kanban/kanban-board";

interface BoardHeaderProps {
  title: string;
  category: CategoriesDoapp | null;
  search: string;
  groupBy: KanbanGroupBy;
  onGroupByChange: (groupBy: KanbanGroupBy) => void;
  onSearchChange: (value: string) => void;
  onClearCategory: () => void;
  onCreate: () => void;
  onOpenAi: () => void;
  onOpenNav: () => void;
  onClearAllDemands?: () => Promise<void>;
  totalDemandsCount?: number;
}

export function BoardHeader({
  title,
  category,
  search,
  groupBy,
  onGroupByChange,
  onSearchChange,
  onClearCategory,
  onCreate,
  onOpenAi,
  onOpenNav,
  onClearAllDemands,
  totalDemandsCount = 0,
}: BoardHeaderProps) {
  const { t } = useTranslation();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirmClear = async () => {
    if (!onClearAllDemands) return;
    setIsClearing(true);
    try {
      await onClearAllDemands();
    } finally {
      setIsClearing(false);
      setClearDialogOpen(false);
    }
  };

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-4 py-3 md:h-14 md:flex-row md:items-center md:gap-3 md:px-6 md:py-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir menu lateral"
          className="size-9 shrink-0 md:hidden"
          onClick={onOpenNav}
        >
          <Menu className="size-5" />
        </Button>

        <h1 className="truncate text-xl font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h1>

        {category && (
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 pl-2 pr-1 text-xs font-medium text-muted-foreground">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10",
                categoryDotClass(category.id),
              )}
            />
            {category.description}
            <button
              type="button"
              aria-label="Limpar filtro de categoria"
              className="inline-flex size-4 items-center justify-center rounded-full transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onClearCategory}
            >
              <X className="size-3" />
            </button>
          </span>
        )}

        {/* Toggle de Agrupamento: Por Status vs Por Prioridade (Estilo Trello) */}
        <div className="hidden lg:flex items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs ml-3">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              groupBy === "status"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onGroupByChange("status")}
            title="Quadro com colunas de Status (Pendente, Em Progresso, Concluído)"
          >
            <Columns3 className="size-3.5" />
            <span>{t("header.byStatus", "Por Status")}</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              groupBy === "priority"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onGroupByChange("priority")}
            title="Quadro com colunas de Prioridade (Urgente, Alta, Normal, Baixa). Arraste para mudar a prioridade!"
          >
            <Flame className="size-3.5 text-rose-500" />
            <span>{t("header.byPriority", "Por Prioridade")}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:ml-auto">
        {/* Toggle de Prioridade mobile/tablet */}
        <div className="flex lg:hidden items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              groupBy === "status"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
            onClick={() => onGroupByChange("status")}
          >
            <Columns3 className="size-3.5" />
            <span>{t("header.byStatus", "Status")}</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              groupBy === "priority"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
            onClick={() => onGroupByChange("priority")}
          >
            <Flame className="size-3.5 text-rose-500" />
            <span>{t("header.byPriority", "Prioridade")}</span>
          </button>
        </div>

        <div className="relative min-w-0 flex-1 md:w-[180px] md:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("header.searchPlaceholder", "Pesquisar chamados...")}
            aria-label="Pesquisar chamados"
            className="h-9 pl-9 text-xs"
          />
        </div>

        {/* Seletor de Idioma (PT / EN) */}
        <LanguageSwitcher />

        {/* Personalizador de Tema e Cor (sem a bolinha azul) */}
        <ThemeCustomizer />

        {onClearAllDemands && totalDemandsCount > 0 && (
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title={t("header.clearBoard", "Limpar quadro de demandas")}
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("header.clearBoardTitle", "Limpar quadro de demandas?")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "header.clearBoardDesc",
                    "Isso removerá as {{count}} demandas cadastradas para você iniciar o dia com a base limpa e pronta para os novos chamados.",
                    { count: totalDemandsCount },
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearing}>
                  {t("header.cancel", "Cancelar")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmClear}
                  disabled={isClearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isClearing ? "Limpando..." : t("header.clearBoardConfirm", "Sim, Limpar Base")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 gap-1.5 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 font-medium text-xs px-3"
          onClick={onOpenAi}
          title="Adicionar chamado colando texto ou print de tela"
        >
          <Sparkles className="size-3.5" />
          <span>{t("header.addWithAi", "Adicionar com IA")}</span>
        </Button>

        <Button type="button" className="h-9 shrink-0 gap-1.5 text-xs px-3" onClick={onCreate}>
          <Plus className="size-4" />
          <span>{t("header.newTask", "Nova Tarefa")}</span>
        </Button>
      </div>
    </header>
  );
}
