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
  PRIORITY_LANES,
  demandIdFromDragId,
  laneDropId,
  laneFromDropId,
  priorityFromDropId,
  priorityLaneDropId,
} from "@/components/kanban/lanes";
import { laneOf, statusOfLane } from "@/lib/demands";
import type {
  CategoriesDoapp,
  LaneKey,
  ListDoapp,
  PriorityLevel,
  TaskStatus,
} from "@/types/doapp";

export type KanbanGroupBy = "status" | "priority";

interface KanbanBoardProps {
  demands: ListDoapp[];
  categories: CategoriesDoapp[];
  now: Date;
  groupBy?: KanbanGroupBy;
  onQuickAdd: (status?: TaskStatus, priority?: PriorityLevel) => void;
  onEdit: (demand: ListDoapp) => void;
  onMove: (demand: ListDoapp, status: TaskStatus) => void;
  onUpdatePriority: (demand: ListDoapp, priority: PriorityLevel) => void;
  onDelete: (demand: ListDoapp) => void;
}

export function KanbanBoard({
  demands,
  categories,
  now,
  groupBy = "status",
  onQuickAdd,
  onEdit,
  onMove,
  onUpdatePriority,
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

  const groupedByStatus = useMemo(() => {
    const byLane: Record<LaneKey, ListDoapp[]> = {
      pending: [],
      in_progress: [],
      done: [],
      overdue: [],
    };
    demands.forEach((demand) => byLane[laneOf(demand, now)].push(demand));
    return byLane;
  }, [demands, now]);

  const groupedByPriority = useMemo(() => {
    const byPriority: Record<PriorityLevel, ListDoapp[]> = {
      urgent: [],
      high: [],
      normal: [],
      low: [],
    };
    demands.forEach((demand) => {
      const p = demand.priority || "normal";
      byPriority[p].push(demand);
    });
    return byPriority;
  }, [demands]);

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

    const demandId = demandIdFromDragId(event.active.id);
    if (demandId === null) return;

    const demand = demands.find((candidate) => candidate.id === demandId);
    if (!demand) return;

    if (groupBy === "priority") {
      const targetPriority = priorityFromDropId(event.over?.id);
      if (targetPriority && (demand.priority || "normal") !== targetPriority) {
        onUpdatePriority(demand, targetPriority);
      }
      return;
    }

    // Modo Status
    const lane = laneFromDropId(event.over?.id);
    const status = lane ? statusOfLane(lane) : null;
    if (status && demand.status !== status) {
      onMove(demand, status);
    }
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
        {groupBy === "priority"
          ? PRIORITY_LANES.map((plane) => (
              <KanbanColumn
                key={plane.key}
                lane={plane}
                dropId={priorityLaneDropId(plane.key)}
                isDroppable={true}
                demands={groupedByPriority[plane.key]}
                categories={categories}
                now={now}
                onQuickAdd={() => onQuickAdd(undefined, plane.priority)}
                onEdit={onEdit}
                onMove={onMove}
                onUpdatePriority={onUpdatePriority}
                onDelete={onDelete}
              />
            ))
          : LANES.map((lane) => (
              <KanbanColumn
                key={lane.key}
                lane={lane}
                dropId={laneDropId(lane.key)}
                isDroppable={lane.status !== null}
                demands={groupedByStatus[lane.key]}
                categories={categories}
                now={now}
                onQuickAdd={
                  lane.status ? () => onQuickAdd(lane.status as TaskStatus) : undefined
                }
                onEdit={onEdit}
                onMove={onMove}
                onUpdatePriority={onUpdatePriority}
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
