import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Elderly } from '../../types';
import { ElderlyCard } from './ElderlyCard';
import { useElderlyStore } from '../../store/elderlyStore';

interface ElderlyGridProps {
  elderlyList: Elderly[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onClick: (elderly: Elderly) => void;
  groupFilter: string | null;
  onGroupFilterChange?: (groupId: string | null) => void;
}

export const ElderlyGrid: React.FC<ElderlyGridProps> = ({
  elderlyList,
  selectedIds,
  onToggleSelect,
  onClick,
  groupFilter,
}) => {
  const { setSortOrder } = useElderlyStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredList = groupFilter
    ? elderlyList.filter((e) => e.groupId === groupFilter)
    : elderlyList;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = filteredList.findIndex((e) => e.id === active.id);
    const overIndex = filteredList.findIndex((e) => e.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const reordered = arrayMove(filteredList, activeIndex, overIndex);

    // Rebuild the full list preserving unshown items
    const shownIds = new Set(reordered.map((e) => e.id));
    const unshown = elderlyList.filter((e) => !shownIds.has(e.id));

    const newOrder = [...reordered, ...unshown];

    // Persist
    setSortOrder(newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredList.map((e) => e.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredList.map((elderly) => (
            <ElderlyCard
              key={elderly.id}
              elderly={elderly}
              isSelected={selectedIds.includes(elderly.id)}
              onToggleSelect={onToggleSelect}
              onClick={onClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
