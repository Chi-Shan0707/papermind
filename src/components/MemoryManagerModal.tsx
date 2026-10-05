import React, { useState } from 'react';
import { MemoryItem } from '../types/paper';
import { 
  addOrUpdateMemory, 
  deleteMemory, 
  getStoredMemories, 
  saveStoredMemories 
} from '../services/storage';
import { 
  Brain, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  X, 
  Clock, 
  Calculator, 
  Check, 
  BookMarked 
} from 'lucide-react';

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdated: () => void;
}

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  onMemoryUpdated,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>(getStoredMemories());
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [formula, setFormula] = useState('');
  const [analogy, setAnalogy] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (item: MemoryItem) => {
    setEditingItem(item);
    setTerm(item.term);
    setDefinition(item.definition);
    setFormula(item.formula || '');
    setAnalogy(item.exampleOrAnalogy || '');
    setNotes(item.userNotes || '');
    setTags(item.tags.join(', '));
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setEditingItem(null);
    setTerm('');
    setDefinition('');
    setFormula('');
    setAnalogy('');
    setNotes('');
    setTags('Mathematics, Machine Learning');
    setIsCreating(true);
  };

  const handleSaveForm = () => {
    if (!term.trim() || !definition.trim()) return;

    const item: MemoryItem = {
      id: editingItem ? editingItem.id : `mem-${Date.now()}`,
      term: term.trim(),
      definition: definition.trim(),
      formula: formula.trim() || undefined,
      exampleOrAnalogy: analogy.trim() || undefined,
      userNotes: notes.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      timesRecalled: editingItem ? editingItem.timesRecalled : 1,
      createdAt: editingItem ? editingItem.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    addOrUpdateMemory(item);
    const updated = getStoredMemories();
    setMemories(updated);
    setEditingItem(null);
    setIsCreating(false);
    onMemoryUpdated();
  };

  const handleDelete = (id: string) => {
    deleteMemory(id);
    const updated = getStoredMemories();
    setMemories(updated);
    onMemoryUpdated();
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(memories, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papermind_knowledge_memory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          saveStoredMemories(parsed);
          setMemories(parsed);
          onMemoryUpdated();
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(e.target.files[0]);
  };

  const filtered = memories.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.term.toLowerCase().includes(q) ||
      m.definition.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Personal Knowledge Memory Store</h3>
              <p className="text-[11px] text-neutral-400">
                Concepts, mathematical definitions, and terms remembered by AI across all paper sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts (e.g. MMD, RKHS)..."
              className="bg-transparent text-xs text-white outline-none flex-1 placeholder:text-neutral-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Concept</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 flex items-center gap-1.5 transition-colors border border-neutral-750"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-colors border border-neutral-750">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col md:flex-row gap-5">
          {/* List of Concepts */}
          <div className={`space-y-2.5 ${isCreating || editingItem ? 'md:w-1/2' : 'w-full'} overflow-y-auto max-h-[55vh]`}>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                No matching concept items found. Click "New Concept" to add one!
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`bg-neutral-950 border rounded-xl p-3.5 space-y-2 transition-all group ${
                    editingItem?.id === item.id ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{item.term}</span>
                      </h4>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Recalled {item.timesRecalled} times
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                        title="Edit Concept"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                        title="Delete Concept"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    {item.definition}
                  </p>

                  {item.formula && (
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-amber-300 overflow-x-auto">
                      $${item.formula}$$
                    </div>
                  )}

                  {item.userNotes && (
                    <div className="text-[10px] text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                      <strong>Personal note:</strong> {item.userNotes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit/Create Form Pane */}
          {(isCreating || editingItem) && (
            <div className="md:w-1/2 bg-neutral-950 border border-emerald-500/40 rounded-xl p-4 space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-bold text-emerald-300">
                  {editingItem ? `Edit: ${editingItem.term}` : 'Add New Knowledge Concept'}
                </span>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingItem(null);
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">Concept / Term Name</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. MMD (Maximum Mean Discrepancy)"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">Clear Definition</label>
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Explain what this means clearly and accurately..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">LaTeX Mathematical Formula</label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g. MMD^2(P,Q) = E[k(x,x')] - 2E[k(x,y)] + E[k(y,y')]"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">Intuitive Example or Analogy</label>
                <input
                  type="text"
                  value={analogy}
                  onChange={(e) => setAnalogy(e.target.value)}
                  placeholder="e.g. Comparing all statistical moments in RKHS feature space..."
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">Personal Notes / How I like it explained</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Remind me why kernel trick is used here"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-medium mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Mathematics, Kernel Methods, Statistics"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingItem(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg shadow-sm"
                >
                  Save Concept
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
