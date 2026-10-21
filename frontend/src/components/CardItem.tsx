import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import type { Card } from '../types';

interface CardItemProps {
  card: Card;
  boardId: string;
  onClick: () => void;
  onDelete: () => void;
}

function dueDateLabel(dueDate: string): { text: string; cls: string } {
  const d = parseISO(dueDate);
  if (isToday(d)) return { text: 'Today', cls: 'badge-yellow' };
  if (isTomorrow(d)) return { text: 'Tomorrow', cls: 'badge-yellow' };
  if (isPast(d)) return { text: format(d, 'MMM d'), cls: 'badge-red' };
  return { text: format(d, 'MMM d'), cls: 'badge-gray' };
}

export default function CardItem({ card, onClick, onDelete }: CardItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedItems = card.checklists?.reduce((a, cl) => a + cl.items.filter((i) => i.completed).length, 0) ?? 0;
  const totalItems = card.checklists?.reduce((a, cl) => a + cl.items.length, 0) ?? 0;
  const allDone = totalItems > 0 && completedItems === totalItems;

  const due = card.dueDate ? dueDateLabel(card.dueDate as string) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg shadow-card hover:shadow-card-lg transition-all duration-150
        group relative select-none
        ${isDragging ? 'cursor-grabbing rotate-1 shadow-card-lg' : 'cursor-pointer hover:-translate-y-px'}
      `}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
        onClick();
      }}
    >
      {/* Color label strip */}
      {card.labels.length > 0 && (
        <div className="flex gap-1 px-2.5 pt-2.5">
          {card.labels.map((label) => (
            <div
              key={label.id}
              className="h-1.5 rounded-full flex-1 max-w-[3rem]"
              style={{ background: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      <div className={`px-3 py-2.5 ${card.labels.length > 0 ? 'pt-1.5' : ''}`}>
        <p className="text-sm text-gray-800 font-medium leading-snug break-words pr-5">
          {card.title}
        </p>

        {/* Badges row */}
        {(due || card.description || totalItems > 0) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {due && (
              <span className={`${due.cls} flex items-center gap-0.5`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {due.text}
              </span>
            )}

            {card.description && (
              <span className="badge-gray" title="Has description">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
            )}

            {totalItems > 0 && (
              <span className={allDone ? 'badge-green' : 'badge-gray'}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {completedItems}/{totalItems}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Context menu trigger */}
      <button
        data-no-drag
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all text-sm font-bold leading-none"
        onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
      >
        ···
      </button>

      {showMenu && (
        <div
          data-no-drag
          className="absolute top-7 right-1.5 bg-white border border-gray-100 rounded-xl shadow-modal py-1.5 z-20 w-36 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { onDelete(); setShowMenu(false); }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete card
          </button>
        </div>
      )}
    </div>
  );
}
