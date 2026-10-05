import React from 'react';
import { SAMPLE_PAPERS, SamplePaperMeta } from '../services/samplePapers';
import { 
  Library, 
  Sparkles, 
  X, 
  ArrowRight, 
  Calculator, 
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';

interface SamplePapersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SamplePaperMeta) => void;
}

export const SamplePapersModal: React.FC<SamplePapersModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Classic Academic Papers</h3>
              <p className="text-[11px] text-neutral-400">
                Instantly load foundational machine learning & mathematics papers with 1-click
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

        {/* Papers List */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {SAMPLE_PAPERS.map((paper) => (
            <div
              key={paper.id}
              className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 hover:border-amber-500/50 transition-all flex flex-col gap-3 group relative"
            >
              {paper.id === 'sample-mmd-kernel' && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  <span>Featured: MMD & Kernel Test</span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors pr-36">
                  {paper.title}
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                  <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-neutral-400">{paper.conferenceOrJournal}</span>
                </div>
              </div>

              <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-2">
                {paper.summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
                <div className="flex flex-wrap gap-1">
                  {paper.keyTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onSelectSample(paper);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Paper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
