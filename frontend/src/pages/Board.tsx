import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragOverEvent, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
  sortableKeyboardCoordinates, arrayMove,
} from '@dnd-kit/sortable';
import { boardsApi } from '../api/boards';
import { listsApi } from '../api/lists';
import { cardsApi } from '../api/cards';
import Navbar from '../components/Navbar';
import ListColumn from '../components/ListColumn';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import type { Board, Card, List } from '../types';

/* Darken a hex color by a given amount for the overlay */
function darkenHex(hex: string, amount = 40): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function AddListForm({ boardId, onDone }: { boardId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (t: string) => listsApi.create(boardId, { title: t }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['board', boardId] }); setTitle(''); onDone(); },
  });

  return (
    <div className="flex-shrink-0 w-[272px] bg-[#f1f2f4] rounded-xl p-2.5 space-y-2 shadow-list animate-slide-up">
      <input
        className="input text-sm"
        placeholder="Enter list title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) create.mutate(title.trim());
          if (e.key === 'Escape') onDone();
        }}
      />
      <div className="flex gap-1.5">
        <button
          className="btn-primary text-sm py-1.5 flex-1"
          disabled={!title.trim() || create.isPending}
          onClick={() => title.trim() && create.mutate(title.trim())}
        >
          {create.isPending ? 'Adding…' : 'Add list'}
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
          onClick={onDone}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AddMemberModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const add = useMutation({
    mutationFn: () => boardsApi.addMember(boardId, email),
    onSuccess: () => { setMsg('Member added successfully!'); setIsError(false); setEmail(''); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } };
      setMsg(err.response?.data?.error ?? 'Failed to add member'); setIsError(true);
    },
  });

  return (
    <div className="modal-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg text-gray-900">Invite a member</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
        <input
          className="input mb-3"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && email.trim() && add.mutate()}
        />

        {msg && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-3 animate-fade-in ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {isError
              ? <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9h2v4H9V9zm0-2h2v2H9V7z" clipRule="evenodd" /></svg>
              : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            }
            {msg}
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-2" disabled={!email.trim() || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? 'Sending invite…' : 'Send invite'}
          </button>
          <button className="btn-white px-4" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addingList, setAddingList] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [localLists, setLocalLists] = useState<List[] | null>(null);

  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', id],
    queryFn: () => boardsApi.get(id!),
    enabled: !!id,
  });

  const updateBoard = useMutation({
    mutationFn: (data: { title?: string; background?: string }) => boardsApi.update(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', id] }),
  });

  const deleteBoard = useMutation({
    mutationFn: () => boardsApi.delete(id!),
    onSuccess: () => navigate('/'),
  });

  const moveCard = useMutation({
    mutationFn: ({ cardId, listId, position }: { cardId: string; listId: string; position: number }) =>
      cardsApi.move(cardId, { listId, position }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['board', id] }); setLocalLists(null); },
  });

  const reorderLists = useMutation({
    mutationFn: (listIds: string[]) => listsApi.reorder(id!, listIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['board', id] }); setLocalLists(null); },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const displayLists = localLists ?? board?.lists ?? [];

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === 'card') setActiveCard(event.active.data.current.card);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;
    const activeData = active.data.current;
    if (activeData?.type !== 'card') return;
    const activeCardData = activeData.card as Card;
    const overId = over.id as string;
    const lists = localLists ?? board.lists;
    const overList = lists.find((l) => l.id === overId) ?? lists.find((l) => l.cards.some((c) => c.id === overId));
    if (!overList || overList.id === activeCardData.listId) return;
    setLocalLists(lists.map((l) => {
      if (l.id === activeCardData.listId) return { ...l, cards: l.cards.filter((c) => c.id !== activeCardData.id) };
      if (l.id === overList.id) return { ...l, cards: [...l.cards, { ...activeCardData, listId: overList.id }] };
      return l;
    }));
  }, [board, localLists]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || !board) return;
    const activeData = active.data.current;
    const lists = localLists ?? board.lists;

    if (activeData?.type === 'list') {
      const activeId = (active.id as string).replace('list-', '');
      const overId = (over.id as string).replace('list-', '');
      if (activeId === overId) return;
      const oldIndex = lists.findIndex((l) => l.id === activeId);
      const newIndex = lists.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const newLists = arrayMove(lists, oldIndex, newIndex);
      setLocalLists(newLists);
      reorderLists.mutate(newLists.map((l) => l.id));
      return;
    }

    if (activeData?.type === 'card') {
      const cardId = active.id as string;
      const overId = over.id as string;
      const targetList = lists.find((l) => l.id === overId) ?? lists.find((l) => l.cards.some((c) => c.id === overId));
      if (!targetList) return;
      const overCardIndex = targetList.cards.findIndex((c) => c.id === overId);
      const position = overCardIndex >= 0 ? overCardIndex + 1 : targetList.cards.length + 1;
      moveCard.mutate({ cardId, listId: targetList.id, position });
    }
  }, [board, localLists, moveCard, reorderLists]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0079BF' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/70 text-sm">Loading board…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">🔒</div>
          <p className="text-gray-700 font-medium">Board not found or access denied.</p>
          <Link to="/" className="btn-primary px-5 py-2">Back to boards</Link>
        </div>
      </div>
    );
  }

  const headerBg = darkenHex(board.background, 30);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: board.background }}>
      <Navbar />

      {/* Board header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 z-10 relative"
        style={{ background: `${headerBg}cc`, backdropFilter: 'blur(8px)' }}
      >
        {/* Breadcrumb */}
        <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Boards
        </Link>
        <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Board title */}
        {editingTitle ? (
          <input
            className="bg-white/20 text-white border border-white/40 rounded-lg px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 w-52"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={() => {
              if (boardTitle.trim() && boardTitle.trim() !== board.title) updateBoard.mutate({ title: boardTitle.trim() });
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (boardTitle.trim() && boardTitle.trim() !== board.title) updateBoard.mutate({ title: boardTitle.trim() });
                setEditingTitle(false);
              }
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            autoFocus
          />
        ) : (
          <button
            className="text-white font-semibold text-sm hover:bg-white/15 px-3 py-1 rounded-lg transition-colors"
            onClick={() => { setBoardTitle(board.title); setEditingTitle(true); }}
          >
            {board.title}
          </button>
        )}

        <div className="flex-1" />

        {/* Member avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {board.members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-white/25 ring-2 ring-white/30 text-white text-xs flex items-center justify-center font-semibold uppercase"
                title={`${m.user.name} · ${m.role}`}
              >
                {m.user.name.charAt(0)}
              </div>
            ))}
          </div>

          <button
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1 rounded-lg transition-colors"
            onClick={() => setShowInvite(true)}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite
          </button>

          <button
            className="text-white/60 hover:text-white hover:bg-white/15 px-2 py-1 rounded-lg text-sm transition-colors"
            onClick={() => confirm('Delete this board and all its data?') && deleteBoard.mutate()}
            title="Delete board"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lists area */}
      <div className="flex-1 overflow-x-auto board-scroll">
        <div className="flex gap-3 p-4 items-start h-full min-h-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayLists.map((l) => `list-${l.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {displayLists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  boardId={board.id}
                  onCardClick={(cardId) => setSelectedCard(cardId)}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
              {activeCard ? (
                <div className="rotate-2 scale-105">
                  <CardItem card={activeCard} boardId={board.id} onClick={() => {}} onDelete={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Add list button */}
          {addingList ? (
            <AddListForm boardId={board.id} onDone={() => setAddingList(false)} />
          ) : (
            <button
              className="flex-shrink-0 w-[272px] bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 text-left flex items-center gap-2 backdrop-blur-sm"
              onClick={() => setAddingList(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another list
            </button>
          )}
        </div>
      </div>

      {selectedCard && (
        <CardModal cardId={selectedCard} boardId={board.id} onClose={() => setSelectedCard(null)} />
      )}
      {showInvite && <AddMemberModal boardId={board.id} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
