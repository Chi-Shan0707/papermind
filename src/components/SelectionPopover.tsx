import React, { useState } from 'react';
import { HighlightColor } from '../types/paper';
import { 
  Highlighter, 
  Underline as UnderlineIcon, 
  Languages, 
  Sparkles, 
  Brain, 
  Copy, 
  Check, 
  X,
  MessageSquarePlus
} from 'lucide-react';

interface SelectionPopoverProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onHighlight: (color: HighlightColor) => void;
  onUnderline: () => void;
  onAddNote: (comment: string) => void;
  onTranslate: (text: string) => void;
  onAskAI: (text: string) => void;
  onSaveToMemory: (text: string) => void;
  onClose: () => void;
}

export const SelectionPopover: React.FC<SelectionPopoverProps> = ({
  position,
  selectedText,
  onHighlight,
  onUnderline,
  onAddNote,
  onTranslate,
  onAskAI,
  onSaveToMemory,
  onClose,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!position || !selectedText.trim()) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  const colors: { name: HighlightColor; bg: string }[] = [
    { name: 'yellow', bg: 'bg-amber-300' },
    { name: 'emerald', bg: 'bg-emerald-300' },
    { name: 'sky', bg: 'bg-sky-300' },
    { name: 'violet', bg: 'bg-purple-300' },
    { name: 'rose', bg: 'bg-rose-300' },
  ];

  return (
    <div
      style={{
        top: `${Math.max(12, position.y - 42)}px`,
        left: `${Math.max(12, position.x)}px`,
      }}
      className="fixed z-50 transform -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-750 rounded-full shadow-2xl px-2 py-1 flex items-center gap-0.5 text-neutral-300">
        {!showColorPicker && !showNoteInput ? (
          <>
            <button
              onClick={() => setShowColorPicker(true)}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors flex items-center gap-1 text-[11px] px-2 font-medium"
              title="Highlight"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>

            <button
              onClick={onUnderline}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors"
              title="Underline"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowNoteInput(true)}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors"
              title="Attach Note"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3.5 bg-neutral-800 mx-0.5" />

            <button
              onClick={() => onTranslate(selectedText)}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors flex items-center gap-1 text-[11px] px-2 font-medium"
              title="Academic Translation"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Translate</span>
            </button>

            <button
              onClick={() => onAskAI(selectedText)}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors flex items-center gap-1 text-[11px] px-2 font-medium text-neutral-100"
              title="Ask Copilot about this"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            <button
              onClick={() => onSaveToMemory(selectedText)}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors flex items-center gap-1 text-[11px] px-2 font-medium"
              title="Save Concept to Personal Memory"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Memory</span>
            </button>

            <div className="w-px h-3.5 bg-neutral-800 mx-0.5" />

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 hover:text-white rounded-full transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : showColorPicker ? (
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <span className="text-[10px] text-neutral-500 font-mono pl-1">COLOR:</span>
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  onHighlight(c.name);
                  setShowColorPicker(false);
                }}
                className={`w-3.5 h-3.5 rounded-full ${c.bg} hover:scale-125 transition-transform`}
                title={c.name}
              />
            ))}
            <button
              onClick={() => setShowColorPicker(false)}
              className="ml-1 text-[10px] text-neutral-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 w-60">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add margin note..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
              className="flex-1 bg-transparent text-xs text-white outline-none"
            />
            <button
              onClick={handleSaveNote}
              className="px-2 py-0.5 bg-neutral-200 hover:bg-white text-neutral-950 font-medium rounded text-[11px]"
            >
              Save
            </button>
            <button
              onClick={() => setShowNoteInput(false)}
              className="p-1 text-neutral-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
