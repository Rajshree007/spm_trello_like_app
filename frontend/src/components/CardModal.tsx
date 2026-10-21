import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api/cards';
import { format, parseISO } from 'date-fns';
import type { Card, Label, Checklist } from '../types';

const LABEL_PRESETS = [
  { color: '#4BCE97', name: 'Green' },
  { color: '#F5CD47', name: 'Yellow' },
  { color: '#FAA53D', name: 'Orange' },
  { color: '#F87168', name: 'Red' },
  { color: '#9F8FEF', name: 'Purple' },
  { color: '#579DFF', name: 'Blue' },
  { color: '#6CC3E0', name: 'Sky' },
  { color: '#94C748', name: 'Lime' },
  { color: '#E774BB', name: 'Pink' },
  { color: '#8590A2', name: 'Gray' },
];

function SidebarAction({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function ChecklistSection({ checklist, cardId, onDelete }: {
  checklist: Checklist; cardId: string; onDelete: () => void;
}) {
  const [newItem, setNewItem] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const addItem = useMutation({
    mutationFn: (text: string) => cardsApi.addChecklistItem(cardId, checklist.id, { text }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['card', cardId] }); setNewItem(''); setShowAdd(false); },
  });

  const toggleItem = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      cardsApi.updateChecklistItem(cardId, checklist.id, itemId, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => cardsApi.deleteChecklistItem(cardId, checklist.id, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const completed = checklist.items.filter((i) => i.completed).length;
  const total = checklist.items.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm text-gray-800">{checklist.title}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Delete
        </button>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{pct}%</span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#4BCE97' : '#579DFF' }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1 pl-6">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5 group py-0.5">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => toggleItem.mutate({ itemId: item.id, completed: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-500 cursor-pointer flex-shrink-0"
            />
            <span className={`text-sm flex-1 leading-relaxed ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.text}
            </span>
            <button
              onClick={() => deleteItem.mutate(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="pl-6">
        {showAdd ? (
          <div className="space-y-2 animate-slide-up">
            <input
              className="input text-sm"
              placeholder="Add an item…"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItem.trim()) addItem.mutate(newItem.trim());
                if (e.key === 'Escape') { setShowAdd(false); setNewItem(''); }
              }}
            />
            <div className="flex gap-1.5">
              <button
                className="btn-primary text-xs py-1 px-3"
                disabled={!newItem.trim() || addItem.isPending}
                onClick={() => newItem.trim() && addItem.mutate(newItem.trim())}
              >
                Add
              </button>
              <button className="btn-white text-xs px-2" onClick={() => { setShowAdd(false); setNewItem(''); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
          >
            + Add an item
          </button>
        )}
      </div>
    </div>
  );
}

interface CardModalProps { cardId: string; boardId: string; onClose: () => void; }

export default function CardModal({ cardId, boardId, onClose }: CardModalProps) {
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [activePanel, setActivePanel] = useState<'label' | 'duedate' | 'checklist' | null>(null);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#579DFF');
  const [checklistTitle, setChecklistTitle] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardsApi.get(cardId),
  });

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? '');
      setDueDate(card.dueDate ? format(parseISO(card.dueDate as string), 'yyyy-MM-dd') : '');
    }
  }, [card]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['card', cardId] });
    qc.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const updateCard = useMutation({ mutationFn: (data: Partial<Card>) => cardsApi.update(cardId, data), onSuccess: invalidate });
  const addLabel = useMutation({
    mutationFn: () => cardsApi.addLabel(cardId, { name: labelName || (LABEL_PRESETS.find(p => p.color === labelColor)?.name ?? labelColor), color: labelColor }),
    onSuccess: () => { invalidate(); setActivePanel(null); setLabelName(''); },
  });
  const deleteLabel = useMutation({ mutationFn: (lId: string) => cardsApi.deleteLabel(cardId, lId), onSuccess: invalidate });
  const createChecklist = useMutation({
    mutationFn: () => cardsApi.createChecklist(cardId, { title: checklistTitle }),
    onSuccess: () => { invalidate(); setChecklistTitle(''); setActivePanel(null); },
  });
  const deleteChecklist = useMutation({ mutationFn: (clId: string) => cardsApi.deleteChecklist(cardId, clId), onSuccess: invalidate });

  function saveTitle() {
    if (title.trim() && title.trim() !== card?.title) updateCard.mutate({ title: title.trim() });
    setEditingTitle(false);
  }

  function saveDescription() { updateCard.mutate({ description: description || null }); setEditingDesc(false); }
  function saveDueDate(val: string) { setDueDate(val); updateCard.mutate({ dueDate: val || null }); }

  if (isLoading) {
    return (
      <div className="modal-overlay flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  if (!card) return null;

  return (
    <div className="modal-overlay flex items-start justify-center pt-8 px-4 pb-8" onClick={onClose}>
      <div
        className="bg-[#f1f2f4] rounded-2xl shadow-modal w-full max-w-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-700 transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title section */}
        <div className="px-5 pt-5 pb-3 pr-14">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <textarea
                  ref={titleRef}
                  className="w-full text-lg font-semibold bg-white rounded-lg border-2 border-brand-500 px-2 py-1 resize-none focus:outline-none leading-snug"
                  value={title}
                  rows={2}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle(); } }}
                  autoFocus
                />
              ) : (
                <h2
                  className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-white rounded-lg px-2 py-1 -ml-2 transition-colors leading-snug"
                  onClick={() => setEditingTitle(true)}
                >
                  {card.title}
                </h2>
              )}
              <p className="text-xs text-gray-500 mt-1 px-2">
                in list{' '}
                <span className="font-medium text-gray-600 underline underline-offset-2">
                  {(card as Card & { list?: { title: string } }).list?.title ?? '…'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 px-5 pb-5">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Labels */}
            {card.labels.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map((label: Label) => (
                    <span
                      key={label.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md text-white text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity group"
                      style={{ background: label.color }}
                      onClick={() => deleteLabel.mutate(label.id)}
                      title="Click to remove"
                    >
                      {label.name}
                      <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Due date */}
            {dueDate && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Due date</p>
                <input
                  type="date"
                  className="input w-auto text-sm"
                  value={dueDate}
                  onChange={(e) => saveDueDate(e.target.value)}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                </svg>
                <p className="text-sm font-semibold text-gray-700">Description</p>
              </div>

              {editingDesc ? (
                <div className="space-y-2 pl-7 animate-slide-up">
                  <textarea
                    className="input resize-none text-sm"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description…"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button className="btn-primary text-sm py-1.5 px-4" onClick={saveDescription}>Save</button>
                    <button className="btn-white text-sm px-3" onClick={() => { setEditingDesc(false); setDescription(card.description ?? ''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className="ml-6 min-h-[56px] bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg p-3 text-sm text-gray-700 cursor-pointer transition-all"
                  onClick={() => setEditingDesc(true)}
                >
                  {description || <span className="text-gray-400">Add a more detailed description…</span>}
                </div>
              )}
            </div>

            {/* Checklists */}
            {card.checklists?.map((cl: Checklist) => (
              <div key={cl.id} className="bg-white rounded-xl p-4 shadow-card">
                <ChecklistSection
                  checklist={cl}
                  cardId={cardId}
                  onDelete={() => deleteChecklist.mutate(cl.id)}
                />
              </div>
            ))}

            {/* Activity */}
            {card.activities && card.activities.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">Activity</p>
                </div>
                <div className="space-y-3 pl-6">
                  {card.activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold uppercase flex-shrink-0">
                        {a.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">{a.user.name}</span>{' '}
                          <span className="text-gray-500">{a.text}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(parseISO(a.createdAt), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-40 flex-shrink-0 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add to card</p>

            <SidebarAction
              active={activePanel === 'label'}
              label="Labels"
              onClick={() => setActivePanel(activePanel === 'label' ? null : 'label')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
            {activePanel === 'label' && (
              <div className="bg-white rounded-xl shadow-modal p-3 space-y-2.5 animate-slide-up">
                <p className="text-xs font-semibold text-gray-500">Color</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {LABEL_PRESETS.map(({ color, name }) => (
                    <button
                      key={color}
                      title={name}
                      className={`h-7 rounded-md transition-all hover:scale-110 ${labelColor === color ? 'ring-2 ring-offset-1 ring-gray-700 scale-110' : ''}`}
                      style={{ background: color }}
                      onClick={() => setLabelColor(color)}
                    />
                  ))}
                </div>
                <input
                  className="input text-xs"
                  placeholder="Label name (optional)"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                />
                <button className="btn-primary w-full text-xs py-1.5" onClick={() => addLabel.mutate()} disabled={addLabel.isPending}>
                  Add label
                </button>
              </div>
            )}

            <SidebarAction
              active={activePanel === 'duedate'}
              label="Due date"
              onClick={() => setActivePanel(activePanel === 'duedate' ? null : 'duedate')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            {activePanel === 'duedate' && (
              <div className="bg-white rounded-xl shadow-modal p-3 animate-slide-up">
                <input
                  type="date"
                  className="input text-xs"
                  value={dueDate}
                  onChange={(e) => saveDueDate(e.target.value)}
                  autoFocus
                />
                {dueDate && (
                  <button className="text-xs text-red-500 hover:text-red-700 mt-2 block" onClick={() => saveDueDate('')}>
                    Remove due date
                  </button>
                )}
              </div>
            )}

            <SidebarAction
              active={activePanel === 'checklist'}
              label="Checklist"
              onClick={() => setActivePanel(activePanel === 'checklist' ? null : 'checklist')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            {activePanel === 'checklist' && (
              <div className="bg-white rounded-xl shadow-modal p-3 space-y-2 animate-slide-up">
                <input
                  className="input text-xs"
                  placeholder="Checklist title"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && checklistTitle.trim() && createChecklist.mutate()}
                />
                <button
                  className="btn-primary w-full text-xs py-1.5"
                  disabled={!checklistTitle.trim() || createChecklist.isPending}
                  onClick={() => createChecklist.mutate()}
                >
                  Add checklist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
