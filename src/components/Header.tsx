import React, { useState } from 'react';
import { PaperDocument } from '../types/paper';
import { 
  BookOpen, 
  Upload, 
  Library, 
  Settings, 
  Brain, 
  PanelRightClose, 
  PanelRightOpen, 
  FileSearch, 
  Terminal,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentPaper: PaperDocument | null;
  onOpenSamplePapers: () => void;
  onOpenSettings: () => void;
  onOpenMemoryManager: () => void;
  onOpenWindowsScript: () => void;
  onFileSelect: (file: File) => void;
  onFetchArxiv: (arxivIdOrUrl: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  memoryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPaper,
  onOpenSamplePapers,
  onOpenSettings,
  onOpenMemoryManager,
  onOpenWindowsScript,
  onFileSelect,
  onFetchArxiv,
  isSidebarOpen,
  onToggleSidebar,
  memoryCount,
}) => {
  const [showArxivInput, setShowArxivInput] = useState(false);
  const [arxivQuery, setArxivQuery] = useState('');
  const [isFetchingArxiv, setIsFetchingArxiv] = useState(false);

  const handleArxivSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arxivQuery.trim()) return;
    setIsFetchingArxiv(true);
    try {
      await onFetchArxiv(arxivQuery.trim());
      setArxivQuery('');
      setShowArxivInput(false);
    } finally {
      setIsFetchingArxiv(false);
    }
  };

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Brand & File actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-800">
          <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-neutral-100 tracking-tight leading-none">PaperMind</span>
            <span className="text-[9px] text-neutral-400 font-mono tracking-wider">READER</span>
          </div>
        </div>

        {/* Paper title info */}
        {currentPaper ? (
          <div className="flex items-center gap-2 max-w-md truncate">
            <span className="text-xs text-neutral-300 font-medium truncate" title={currentPaper.title}>
              {currentPaper.title}
            </span>
            {currentPaper.arxivId && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono border border-neutral-700 shrink-0">
                arXiv:{currentPaper.arxivId}
              </span>
            )}
            <span className="text-[10px] text-neutral-500 font-mono shrink-0">
              ({currentPaper.pageCount}p)
            </span>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 italic">No paper loaded</div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 text-xs">
        {/* arXiv Direct Import Input */}
        {showArxivInput ? (
          <form onSubmit={handleArxivSubmit} className="flex items-center gap-1.5 animate-in fade-in">
            <input
              type="text"
              value={arxivQuery}
              onChange={(e) => setArxivQuery(e.target.value)}
              placeholder="arXiv ID (e.g. 1706.03762)"
              autoFocus
              className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white outline-none w-52 placeholder:text-neutral-500 focus:border-neutral-500 font-mono"
            />
            <button
              type="submit"
              disabled={isFetchingArxiv}
              className="px-2.5 py-1 bg-neutral-200 hover:bg-white text-neutral-950 font-medium rounded text-xs transition-colors"
            >
              {isFetchingArxiv ? 'Loading...' : 'Fetch'}
            </button>
            <button
              type="button"
              onClick={() => setShowArxivInput(false)}
              className="px-1 text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowArxivInput(true)}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors border border-neutral-700/60"
            title="Import directly from arXiv"
          >
            <FileSearch className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">arXiv URL</span>
          </button>
        )}

        {/* Sample Papers */}
        <button
          onClick={onOpenSamplePapers}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors border border-neutral-700/60"
          title="Browse Classic Sample Papers"
        >
          <Library className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Sample Papers</span>
        </button>

        {/* File upload button */}
        <label className="px-2.5 py-1.5 rounded-lg bg-neutral-200 hover:bg-white text-neutral-950 font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
          <Upload className="w-3.5 h-3.5" />
          <span>Open PDF</span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {/* Personal Knowledge Memory button */}
        <button
          onClick={onOpenMemoryManager}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 flex items-center gap-1.5 transition-colors border border-neutral-700/60"
          title="Personal Knowledge Memory Store"
        >
          <Brain className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden md:inline font-medium">Memory</span>
          <span className="px-1.5 py-0.2 bg-neutral-700 text-neutral-200 rounded font-mono text-[10px]">
            {memoryCount}
          </span>
        </button>

        {/* Windows local script launcher */}
        <button
          onClick={onOpenWindowsScript}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="Windows Script / Local Setup"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Settings modal button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="AI & OpenRouter Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Sidebar Collapse/Expand */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title={isSidebarOpen ? 'Collapse AI Sidebar' : 'Open AI Sidebar'}
        >
          {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
