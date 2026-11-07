import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { DemandCardPreview } from "@/components/kanban/demand-card";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import {
  LANES,
  demandIdFromDragId,
  laneFromDropId,
} from "@/components/kanban/lanes";
import { laneOf, statusOfLane } from "@/lib/demands";
import type { CategoriesDoapp, LaneKey, ListDoapp, TaskStatus } from "@/types/doapp";

interface KanbanBoardProps {
  demands: ListDoapp[];
  categories: CategoriesDoapp[];
  now: Date;
  onQuickAdd: (status: TaskStatus) => void;
  onEdit: (demand: ListDoapp) => void;
  onMove: (demand: ListDoapp, status: TaskStatus) => void;
  onDelete: (demand: ListDoapp) => void;
}

export function KanbanBoard({
  demands,
  categories,
  now,
  onQuickAdd,
  onEdit,
  onMove,
  onDelete,
}: KanbanBoardProps) {
  const [activeDemandId, setActiveDemandId] = useState<number | null>(null);

  const sensors = useSensors(
    // A short travel threshold keeps a plain click on the card menu a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch needs a press delay so tapping a card never starts a drag.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const byLane: Record<LaneKey, ListDoapp[]> = {
      pending: [],
      in_progress: [],
      done: [],
      overdue: [],
    };
    demands.forEach((demand) => byLane[laneOf(demand, now)].push(demand));
    return byLane;
  }, [demands, now]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const activeDemand =
    activeDemandId === null
      ? null
      : demands.find((demand) => demand.id === activeDemandId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDemandId(demandIdFromDragId(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDemandId(null);

    const lane = laneFromDropId(event.over?.id);
    const demandId = demandIdFromDragId(event.active.id);
    const status = lane ? statusOfLane(lane) : null;

    if (demandId === null || !status) return;

    const demand = demands.find((candidate) => candidate.id === demandId);
    if (!demand || demand.status === status) return;

    onMove(demand, status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDemandId(null)}
    >
      <div className="grid h-full min-h-0 grid-cols-[repeat(4,minmax(240px,1fr))] gap-4 overflow-x-auto pb-1">
        {LANES.map((lane) => (
          <KanbanColumn
            key={lane.key}
            lane={lane}
            demands={grouped[lane.key]}
            categories={categories}
            now={now}
            onQuickAdd={onQuickAdd}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 240, easing: "cubic-bezier(0.05, 0.7, 0.1, 1)" }}
      >
        {activeDemand ? (
          <DemandCardPreview
            demand={activeDemand}
            category={categoryById.get(activeDemand.category_id)}
            now={now}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
