import { useDraggable } from "@dnd-kit/core";
import {
  ArrowRightLeft,
  CalendarClock,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demandDragId } from "@/components/kanban/lanes";
import { categoryDotClass } from "@/lib/category-colors";
import { describeDeadline, isOverdue } from "@/lib/demands";
import { cn } from "@/lib/utils";
import { TASK_STATUSES } from "@/types/doapp";
import type { CategoriesDoapp, ListDoapp, TaskStatus } from "@/types/doapp";

const CARD_SHELL =
  "group/card relative flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-card transition-[transform,box-shadow,border-color] duration-fast ease-standard motion-reduce:transition-none";

const CARD_INTERACTIVE =
  "hover:-translate-y-px hover:border-primary/30 hover:shadow-elevated motion-reduce:hover:translate-y-0";

interface DemandCardBodyProps {
  demand: ListDoapp;
  category?: CategoriesDoapp;
  now: Date;
  /** Rendered in the drag overlay: no menu, lifted look. */
  dragging?: boolean;
  onEdit?: (demand: ListDoapp) => void;
  onMove?: (demand: ListDoapp, status: TaskStatus) => void;
  onDelete?: (demand: ListDoapp) => void;
}

function DemandCardBody({
  demand,
  category,
  now,
  dragging = false,
  onEdit,
  onMove,
  onDelete,
}: DemandCardBodyProps) {
  const overdue = isOverdue(demand, now);
  const deadlineLabel = describeDeadline(demand.deadline, now);

  return (
    <div
      className={cn(
        CARD_SHELL,
        !dragging && CARD_INTERACTIVE,
        overdue && "border-l-[3px] border-l-lane-overdue bg-lane-overdue-soft/50",
        dragging && "rotate-[1.5deg] scale-[1.02] shadow-drag ring-2 ring-primary/40",
      )}
    >
      <p className="line-clamp-2 pr-6 text-sm font-medium leading-snug text-card-foreground">
        {demand.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="inline-flex h-5 max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 text-2xs font-medium text-muted-foreground">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10",
              categoryDotClass(category?.id ?? 0),
            )}
          />
          <span className="truncate">{category?.description ?? "Uncategorized"}</span>
        </span>

        {deadlineLabel && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-2xs font-medium tabular-nums",
              overdue ? "text-lane-overdue-foreground" : "text-muted-foreground",
            )}
          >
            <CalendarClock className="size-3" />
            {deadlineLabel}
          </span>
        )}

        {demand.link && (
          <a
            href={demand.link}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the demand link"
            className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-fast ease-standard hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      {!dragging && onEdit && onMove && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Demand actions"
              className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-opacity duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onEdit(demand)}>
              <Pencil className="size-4" />
              Edit demand
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-2xs uppercase tracking-[0.08em] text-muted-foreground">
              Move to
            </DropdownMenuLabel>
            {TASK_STATUSES.filter((status) => status.value !== demand.status).map(
              (status) => (
                <DropdownMenuItem
                  key={status.value}
                  onSelect={() => onMove(demand, status.value)}
                >
                  <ArrowRightLeft className="size-4" />
                  {status.label}
                </DropdownMenuItem>
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(demand)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** Card on the board: draggable onto another lane to change its status. */
export function DemandCard(props: DemandCardBodyProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: demandDragId(props.demand.id),
    data: { demandId: props.demand.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : undefined }}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <DemandCardBody {...props} />
    </div>
  );
}

/** Visual twin used by the drag overlay while a card is in flight. */
export function DemandCardPreview(props: DemandCardBodyProps) {
  return <DemandCardBody {...props} dragging />;
}
