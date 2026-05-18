import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle } from 'lucide-react';
import type { Elderly } from '../../types';

interface ElderlyCardProps {
  elderly: Elderly;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (elderly: Elderly) => void;
}

export const ElderlyCard: React.FC<ElderlyCardProps> = ({
  elderly,
  isSelected,
  onToggleSelect,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: elderly.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg bg-white
        ${isSelected
          ? 'border-warm-500 shadow-md ring-2 ring-warm-300'
          : 'border-warm-200 hover:border-warm-300'
        }
        ${isDragging ? 'shadow-xl z-50' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-warm-300 hover:text-warm-500 transition-colors"
      >
        <GripVertical size={18} />
      </div>

      {/* Checkbox */}
      <div
        className="absolute top-2 right-2"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(elderly.id);
        }}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer
            ${isSelected
              ? 'bg-warm-500 border-warm-500 text-white'
              : 'border-gray-300 hover:border-warm-400'
            }`}
        >
          {isSelected && <CheckCircle size={14} />}
        </div>
      </div>

      {/* Card body */}
      <div
        onClick={() => onClick(elderly)}
        className="flex flex-col items-center pt-4"
      >
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-warm-600">
            {elderly.name.charAt(0)}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate max-w-full">
          {elderly.name}
        </h3>

        {/* Room number */}
        {elderly.roomNumber && (
          <p className="text-sm text-gray-500 mb-2">
            🏠 {elderly.roomNumber}
          </p>
        )}

        {/* Group badge */}
        {elderly.groupName && elderly.groupName !== '默认分组' && (
          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-warm-100 text-warm-700 font-medium">
            {elderly.groupName}
          </span>
        )}
      </div>
    </div>
  );
};
