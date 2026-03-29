'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SessionStrain {
  id: string;
  strainId: string;
  orderIndex: number;
  revealedAt: string | null;
  strain: {
    id: string;
    name: string;
    genetics: string | null;
    strainType: string | null;
  };
}

interface SortableStrainItemProps {
  strain: SessionStrain;
  index: number;
  isHost: boolean;
  onRemove: (id: string) => void;
  isCurrentStrain: boolean;
}

function SortableStrainItem({ strain, index, isHost, onRemove, isCurrentStrain }: SortableStrainItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: strain.id, disabled: !isHost || !!strain.revealedAt });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = !!strain.revealedAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isCurrentStrain
          ? 'bg-green-900/30 border border-green-600'
          : isCompleted
          ? 'bg-[#1a1a1a] opacity-60'
          : 'bg-[#252525]'
      }`}
    >
      {/* Drag handle */}
      {isHost && !isCompleted && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing touch-none"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </button>
      )}

      {/* Order number */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          isCurrentStrain
            ? 'bg-green-600 text-white'
            : isCompleted
            ? 'bg-green-800 text-white'
            : 'bg-[#333] text-gray-400'
        }`}
      >
        {isCompleted ? '✓' : index + 1}
      </div>

      {/* Strain info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{strain.strain.name}</p>
        <p className="text-sm text-gray-500">
          {strain.strain.genetics || strain.strain.strainType || 'Unknown'}
        </p>
      </div>

      {/* Status badge */}
      {isCurrentStrain && (
        <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
          Current
        </span>
      )}

      {/* Remove button (host only, not if completed) */}
      {isHost && !isCompleted && !isCurrentStrain && (
        <button
          onClick={() => onRemove(strain.id)}
          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface DraggableStrainListProps {
  strains: SessionStrain[];
  isHost: boolean;
  currentStrainId: string | null;
  onReorder: (reorder: Array<{ sessionStrainId: string; newOrderIndex: number }>) => void;
  onRemove: (sessionStrainId: string) => void;
}

export default function DraggableStrainList({
  strains,
  isHost,
  currentStrainId,
  onReorder,
  onRemove,
}: DraggableStrainListProps) {
  const [items, setItems] = useState(strains);

  // Update local state when props change
  if (strains.length !== items.length || strains.some((s, i) => s.id !== items[i]?.id)) {
    setItems(strains);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Build reorder payload
      const reorder = newItems.map((item, idx) => ({
        sessionStrainId: item.id,
        newOrderIndex: idx,
      }));

      onReorder(reorder);
    }
  };

  if (strains.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p>No strains in queue</p>
        <p className="text-sm">Add strains to get started</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((strain, index) => (
            <SortableStrainItem
              key={strain.id}
              strain={strain}
              index={index}
              isHost={isHost}
              onRemove={onRemove}
              isCurrentStrain={strain.strainId === currentStrainId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
