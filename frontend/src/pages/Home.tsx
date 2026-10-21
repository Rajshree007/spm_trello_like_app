import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '../api/boards';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import type { Board } from '../types';

const COLORS = [
  { hex: '#0079BF', label: 'Ocean' },
  { hex: '#70B500', label: 'Lime' },
  { hex: '#FF9F19', label: 'Sunset' },
  { hex: '#EB5A46', label: 'Coral' },
  { hex: '#C377E0', label: 'Lavender' },
  { hex: '#FF78CB', label: 'Rose' },
  { hex: '#00C2E0', label: 'Sky' },
  { hex: '#51E898', label: 'Mint' },
  { hex: '#344563', label: 'Navy' },
  { hex: '#B04632', label: 'Rust' },
];

function CreateBoardModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [bg, setBg] = useState('#0079BF');
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => boardsApi.create({ title: title.trim(), background: bg }),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      onClose();
      window.location.href = `/board/${board.id}`;
    },
  });

  return (
    <div className="modal-overlay flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-modal w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div
          className="h-32 rounded-t-2xl flex flex-col justify-end p-4 relative overflow-hidden"
          style={{ background: bg }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <p className="relative text-white font-semibold text-base truncate">
            {title || <span className="opacity-60">Board title</span>}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Background</p>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  title={label}
                  className={`h-8 rounded-lg transition-all duration-150 hover:scale-105 ${bg === hex ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : ''}`}
                  style={{ background: hex }}
                  onClick={() => setBg(hex)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Board title <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Roadmap"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && mutate()}
            />
            {error && <p className="text-red-500 text-xs mt-1">Failed to create board. Try again.</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              className="btn-primary flex-1 py-2"
              disabled={!title.trim() || isPending}
              onClick={() => mutate()}
            >
              {isPending
                ? <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating…</span>
                : 'Create board'
              }
            </button>
            <button className="btn-white px-4" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ board, onDelete }: { board: Board; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const cardCount = board.lists?.reduce((a, l) => a + (l.cards?.length ?? 0), 0) ?? 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{ background: board.background }}
      onClick={() => navigate(`/board/${board.id}`)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 group-hover:to-black/50 transition-all duration-200" />

      {/* Hover lift */}
      <div className="absolute inset-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card-lg" />

      <div className="relative h-28 p-3 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-white text-sm leading-snug max-w-[80%] drop-shadow">
            {board.title}
          </h3>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md bg-black/20 hover:bg-black/40 text-white text-lg leading-none"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
          >
            ···
          </button>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {board.members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="w-5 h-5 rounded-full bg-white/30 ring-1 ring-white/50 text-white text-xs flex items-center justify-center font-semibold uppercase"
                title={m.user.name}
              >
                {m.user.name.charAt(0)}
              </div>
            ))}
            {board.members.length > 4 && (
              <div className="w-5 h-5 rounded-full bg-black/20 ring-1 ring-white/30 text-white text-xs flex items-center justify-center">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          {cardCount > 0 && (
            <span className="text-white/70 text-xs bg-black/20 px-1.5 py-0.5 rounded">
              {cardCount} {cardCount === 1 ? 'card' : 'cards'}
            </span>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          className="absolute top-9 right-2 bg-white rounded-xl shadow-modal border border-gray-100 py-1.5 z-10 w-40 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { onDelete(board.id); setMenuOpen(false); }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete board
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: boardsApi.list,
  });

  const { mutate: deleteBoard } = useMutation({
    mutationFn: boardsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.name ? `${user.name.split(' ')[0]}'s workspace` : 'My boards'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {boards?.length ?? 0} {boards?.length === 1 ? 'board' : 'boards'}
            </p>
          </div>
          <button
            className="btn-primary px-4 py-2 gap-1.5"
            onClick={() => setShowCreate(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New board
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl skeleton" />
            ))}
          </div>
        ) : boards?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">No boards yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              Boards help you organize tasks into lists. Create your first one to get started.
            </p>
            <button className="btn-primary px-5 py-2.5" onClick={() => setShowCreate(true)}>
              Create your first board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards?.map((board) => (
              <BoardCard key={board.id} board={board} onDelete={deleteBoard} />
            ))}

            {/* Add new */}
            <button
              className="h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-brand-500 group"
              onClick={() => setShowCreate(true)}
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">New board</span>
            </button>
          </div>
        )}
      </main>

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
