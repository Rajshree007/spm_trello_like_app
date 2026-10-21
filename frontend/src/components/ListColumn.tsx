import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api/cards';
import { listsApi } from '../api/lists';
import CardItem from './CardItem';
import type { List } from '../types';

interface ListColumnProps {
  list: List;
  boardId: string;
  onCardClick: (cardId: string) => void;
}

export default function ListColumn({ list, boardId, onCardClick }: ListColumnProps) {
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (addingCard) inputRef.current?.focus(); }, [addingCard]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const { setNodeRef: setDropRef } = useDroppable({ id: list.id, data: { type: 'list', listId: list.id } });

  const { attributes, listeners, setNodeRef: setSortRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id },
  });

  const setNodeRef = (node: HTMLElement | null) => { setSortRef(node); setDropRef(node); };

  const createCard = useMutation({
    mutationFn: (t: string) => cardsApi.create(list.id, { title: t }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', boardId] });
      setNewCardTitle('');
      setAddingCard(false);
    },
  });

  const deleteCard = useMutation({
    mutationFn: (id: string) => cardsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const updateTitle = useMutation({
    mutationFn: (t: string) => listsApi.update(list.id, { title: t }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const deleteList = useMutation({
    mutationFn: () => listsApi.delete(boardId, list.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  function saveTitle() {
    if (title.trim() && title.trim() !== list.title) updateTitle.mutate(title.trim());
    else setTitle(list.title);
    setEditingTitle(false);
  }

  function submitCard() {
    if (newCardTitle.trim()) createCard.mutate(newCardTitle.trim());
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-[272px] flex flex-col max-h-[calc(100vh-6.5rem)] rounded-xl bg-[#f1f2f4] shadow-list"
    >
      {/* Header */}
      <div
        className="flex items-center gap-1 px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editingTitle ? (
          <input
            className="flex-1 text-sm font-semibold bg-white border-2 border-brand-500 rounded-md px-2 py-1 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') { setTitle(list.title); setEditingTitle(false); }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-[#172b4d] flex-1 py-1 cursor-text hover:bg-white/60 rounded px-1.5 -ml-1.5 transition-colors"
            onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
          >
            {list.title}
          </h3>
        )}

        {/* Card count */}
        {list.cards.length > 0 && !editingTitle && (
          <span className="text-[11px] font-medium text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5 leading-none">
            {list.cards.length}
          </span>
        )}

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}
            title="List options"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="8" cy="2" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="14" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-modal py-1.5 z-30 w-44 animate-slide-up">
              <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">List actions</p>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => { setAddingCard(true); setShowMenu(false); }}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add a card
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => { deleteList.mutate(); setShowMenu(false); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-1 space-y-2 min-h-[2px]">
        <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              boardId={boardId}
              onClick={() => onCardClick(card.id)}
              onDelete={() => deleteCard.mutate(card.id)}
            />
          ))}
        </SortableContext>

        {list.cards.length === 0 && !addingCard && (
          <div className="h-6" />
        )}
      </div>

      {/* Add card footer */}
      <div className="px-2 pb-2 pt-1">
        {addingCard ? (
          <div className="space-y-2 animate-slide-up">
            <textarea
              ref={inputRef}
              className="w-full text-sm bg-white rounded-lg border-0 shadow-card p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Enter a title for this card…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(); }
                if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
              }}
            />
            <div className="flex items-center gap-1.5">
              <button
                className="btn-primary text-sm py-1.5 px-3"
                disabled={!newCardTitle.trim() || createCard.isPending}
                onClick={submitCard}
              >
                {createCard.isPending ? 'Adding…' : 'Add card'}
              </button>
              <button
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-colors text-lg leading-none"
                onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full flex items-center gap-1.5 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors group"
            onClick={() => setAddingCard(true)}
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
