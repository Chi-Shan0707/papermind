import React, { useState, useEffect } from 'react';
import { translateAcademicText } from '../services/aiService';
import { addOrUpdateMemory, getStoredMemories } from '../services/storage';
import { MemoryItem } from '../types/paper';
import { 
  Languages, 
  Copy, 
  Check, 
  X, 
  Brain, 
  Sparkles, 
  ArrowRightLeft,
  BookOpen
} from 'lucide-react';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onMemoryUpdated: () => void;
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  onMemoryUpdated,
}) => {
  const [targetLang, setTargetLang] = useState<'zh' | 'en'>('zh');
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState('');
  const [glossary, setGlossary] = useState<{ en: string; zh: string; notes: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedTerms, setSavedTerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && selectedText) {
      handleTranslate();
    }
  }, [isOpen, selectedText, targetLang]);

  if (!isOpen) return null;

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const res = await translateAcademicText(selectedText, targetLang);
      setTranslation(res.translated);
      setGlossary(res.terminologyBreakdown);
    } catch (e: any) {
      setTranslation(`Translation error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveTermToMemory = (item: { en: string; zh: string; notes: string }) => {
    const memoryItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      term: `${item.en} (${item.zh})`,
      definition: item.notes || `Academic translation: ${item.zh}`,
      tags: ['Academic Translation', 'Terminology'],
      timesRecalled: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addOrUpdateMemory(memoryItem);
    setSavedTerms((prev) => ({ ...prev, [item.en]: true }));
    onMemoryUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Academic Translation & Terminology</h3>
              <p className="text-[11px] text-neutral-400">Preserves LaTeX formulas, mathematical notation, and scholarly nuances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target language toggle */}
          <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl border border-neutral-800">
            <span className="text-neutral-400">Target Language:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTargetLang('zh')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  targetLang === 'zh'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                中文 (Chinese)
              </button>
              <button
                onClick={() => setTargetLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  targetLang === 'en'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Original Text Excerpt */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Original Passage
            </div>
            <p className="text-neutral-300 font-serif leading-relaxed italic text-[11px]">
              "{selectedText}"
            </p>
          </div>

          {/* Translation Result */}
          <div className="bg-neutral-950 border border-indigo-500/30 rounded-xl p-4 space-y-2 relative shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Academic Translation</span>
              </div>
              <button
                onClick={handleCopy}
                disabled={loading || !translation}
                className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px]">Translating with mathematical rigor...</span>
              </div>
            ) : (
              <div className="text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {translation}
              </div>
            )}
          </div>

          {/* Extracted Terminology Table */}
          {glossary.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                <span>Key Mathematical & Technical Terms</span>
                <span className="text-[10px] text-neutral-500">Click to pin to your Memory</span>
              </div>
              <div className="space-y-1.5">
                {glossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-amber-300">{item.en}</span>
                      <span className="text-neutral-400 mx-2">→</span>
                      <span className="text-emerald-300 font-medium">{item.zh}</span>
                      {item.notes && <span className="text-neutral-500 text-[10px] ml-2">({item.notes})</span>}
                    </div>

                    <button
                      onClick={() => handleSaveTermToMemory(item)}
                      disabled={savedTerms[item.en]}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                        savedTerms[item.en]
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      <Brain className="w-3 h-3" />
                      <span>{savedTerms[item.en] ? 'In Memory' : 'Pin Memory'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
