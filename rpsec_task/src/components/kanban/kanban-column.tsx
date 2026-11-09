import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DemandCard } from "@/components/kanban/demand-card";
import type { LaneDefinition, PriorityLaneDefinition } from "@/components/kanban/lanes";
import { cn } from "@/lib/utils";
import type { CategoriesDoapp, ListDoapp, PriorityLevel, TaskStatus } from "@/types/doapp";

export interface KanbanColumnProps {
  lane: LaneDefinition | PriorityLaneDefinition;
  dropId: string;
  isDroppable?: boolean;
  demands: ListDoapp[];
  categories: CategoriesDoapp[];
  now: Date;
  onQuickAdd?: () => void;
  onEdit: (demand: ListDoapp) => void;
  onMove?: (demand: ListDoapp, status: TaskStatus) => void;
  onUpdatePriority?: (demand: ListDoapp, priority: PriorityLevel) => void;
  onDelete: (demand: ListDoapp) => void;
}

export function KanbanColumn({
  lane,
  dropId,
  isDroppable = true,
  demands,
  categories,
  now,
  onQuickAdd,
  onEdit,
  onMove,
  onUpdatePriority,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { lane: lane.key },
    disabled: !isDroppable,
  });

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const LaneIcon = lane.icon;
  const { t } = useTranslation();

  const laneTitle = useMemo(() => {
    switch (lane.key) {
      case "pending":
        return t("lanes.pending", "Pendente");
      case "in_progress":
        return t("lanes.inProgress", "Em Progresso");
      case "done":
        return t("lanes.done", "Concluído");
      case "overdue":
        return t("lanes.overdue", "Atrasado");
      case "urgent":
        return t("lanes.urgent", "Urgente (Hoje)");
      case "high":
        return t("lanes.high", "Alta Prioridade");
      case "normal":
        return t("lanes.normal", "Normal / Média");
      case "low":
        return t("lanes.low", "Baixa / Standby");
      default:
        return lane.label;
    }
  }, [lane.key, lane.label, t]);

  return (
    <section
      className={cn(
        "group/lane flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/40 transition-[background-color,border-color,box-shadow] duration-base ease-standard motion-reduce:transition-none",
        lane.style.column,
        isDroppable && isOver && lane.style.drop,
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-border px-3 py-2",
          lane.style.header,
        )}
      >
        <span className={cn("size-2 shrink-0 rounded-full", lane.style.dot)} />
        <h2
          className={cn(
            "text-2xs font-semibold uppercase tracking-[0.08em]",
            lane.style.title,
          )}
        >
          {laneTitle}
        </h2>
        <span
          className={cn(
            "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-semibold tabular-nums",
            lane.style.badge,
          )}
        >
          {demands.length}
        </span>

        {onQuickAdd && (
          <button
            type="button"
            onClick={onQuickAdd}
            aria-label={`Adicionar demanda em ${lane.label}`}
            className={cn(
              "ml-auto inline-flex size-6 items-center justify-center rounded-md opacity-100 transition-opacity duration-fast ease-standard hover:bg-foreground/10 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover/lane:opacity-100",
              lane.style.title,
            )}
          >
            <Plus className="size-4" />
          </button>
        )}
      </header>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        {demands.map((demand) => (
          <DemandCard
            key={demand.id}
            demand={demand}
            category={categoryById.get(demand.category_id)}
            now={now}
            onEdit={onEdit}
            onMove={onMove}
            onUpdatePriority={onUpdatePriority}
            onDelete={onDelete}
          />
        ))}

        {demands.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
            <LaneIcon className="size-5 text-muted-foreground/50" />
            <p className="text-xs leading-snug text-muted-foreground">{lane.emptyLabel}</p>
          </div>
        )}
      </div>
    </section>
  );
}
