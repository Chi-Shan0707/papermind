import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Annotation, HighlightColor } from '../types/paper';
import { PDFDocumentHandler } from '../services/pdfService';
import { SelectionPopover } from './SelectionPopover';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  UploadCloud, 
  Search,
  Bookmark
} from 'lucide-react';

interface PDFViewerProps {
  pdfBuffer: ArrayBuffer | null;
  currentPage: number;
  scale: number;
  annotations: Annotation[];
  onPageChange: (newPage: number) => void;
  onScaleChange: (newScale: number) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onTranslateSelection: (text: string) => void;
  onAskAISelection: (text: string) => void;
  onSaveToMemorySelection: (text: string) => void;
  onFileDrop: (file: File) => void;
  onExtractedText?: (text: string) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfBuffer,
  currentPage,
  scale,
  annotations,
  onPageChange,
  onScaleChange,
  onAddAnnotation,
  onTranslateSelection,
  onAskAISelection,
  onSaveToMemorySelection,
  onFileDrop,
  onExtractedText,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pdfHandlerRef = useRef<PDFDocumentHandler | null>(null);
  const lastLoadedBufferRef = useRef<ArrayBuffer | null>(null);
  const onExtractedTextRef = useRef(onExtractedText);
  onExtractedTextRef.current = onExtractedText;

  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);

  // Initialize and load PDF document
  useEffect(() => {
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      setTotalPages(0);
      lastLoadedBufferRef.current = null;
      return;
    }

    // Skip if already loaded this exact buffer
    if (lastLoadedBufferRef.current === pdfBuffer && pdfHandlerRef.current) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const handler = new PDFDocumentHandler();
    pdfHandlerRef.current = handler;
    lastLoadedBufferRef.current = pdfBuffer;

    handler
      .loadFromBuffer(pdfBuffer.slice(0))
      .then(async (pages) => {
        if (!isMounted) return;
        setTotalPages(pages);
        setLoading(false);

        // Extract full text asynchronously for AI context
        if (onExtractedTextRef.current) {
          const text = await handler.extractFullText(15);
          if (isMounted && onExtractedTextRef.current) {
            onExtractedTextRef.current(text);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF Load Error:', err);
        setError('Failed to render PDF. Please ensure the file is a valid PDF document.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pdfBuffer]);

  // Render current page when page or scale changes
  useEffect(() => {
    if (!pdfHandlerRef.current || totalPages === 0 || !canvasRef.current) return;

    let isCancelled = false;
    setLoading(true);

    pdfHandlerRef.current
      .renderPage({
        pageNumber: currentPage,
        scale,
        canvas: canvasRef.current,
        textLayerDiv: textLayerRef.current || undefined,
      })
      .then(() => {
        if (!isCancelled) setLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Page render error:', err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, scale, totalPages]);

  // Handle Text Selection in Document
  const handleMouseUp = useCallback(() => {
    // Small timeout to allow browser selection object to update
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionPos(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length > 1) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionPos({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      } else {
        setSelectionPos(null);
        setSelectedText('');
      }
    }, 50);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.key === 'j' || e.key === 'PageDown' || e.key === 'ArrowRight') && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      } else if ((e.key === 'k' || e.key === 'PageUp' || e.key === 'ArrowLeft') && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        onScaleChange(Math.min(scale + 0.15, 2.5));
      } else if (e.key === '-' || e.key === '_') {
        onScaleChange(Math.max(scale - 0.15, 0.6));
      } else if (e.key === '0') {
        onScaleChange(1.15); // Default fit width
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearchBar((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, scale, onPageChange, onScaleChange]);

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onFileDrop(file);
      }
    }
  };

  // Annotations for current page
  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // If no document is loaded, display sleek drag-and-drop prompt
  if (!pdfBuffer) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${
          isDragOver ? 'bg-amber-500/10 border-2 border-dashed border-amber-500' : 'bg-neutral-950'
        }`}
      >
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-indigo-500/5 opacity-50" />
          
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center mb-5 text-amber-400 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Drag & Drop Paper Here</h2>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Drop any research paper PDF into this window to start reading, highlighting, and analyzing with AI.
          </p>

          <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30">
            <FileText className="w-4 h-4" />
            <span>Select PDF from Computer</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileDrop(e.target.files[0]);
                }
              }}
            />
          </label>

          <div className="mt-6 pt-6 border-t border-neutral-800/80 flex items-center justify-center gap-4 text-xs text-neutral-500">
            <span>⚡ Lightweight</span>
            <span>•</span>
            <span>🔒 100% Local Reading</span>
            <span>•</span>
            <span>🧠 Memory Powered</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseUp={handleMouseUp}
      className={`relative flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none ${
        isDragOver ? 'ring-2 ring-amber-500 ring-inset' : ''
      }`}
    >
      {/* Floating Selection Toolbar */}
      <SelectionPopover
        position={selectionPos}
        selectedText={selectedText}
        onHighlight={(color: HighlightColor) => {
          onAddAnnotation({
            paperId: '',
            pageNumber: currentPage,
            text: selectedText,
            color,
            type: 'highlight',
          });
          setSelectionPos(null);
        }}
        onUnderline={() => {
          onAddAnnotation({
            paperId: '',
            pageNumber: currentPage,
            text: selectedText,
            color: 'yellow',
            type: 'underline',
          });
          setSelectionPos(null);
        }}
        onAddNote={(comment: string) => {
          onAddAnnotation({
            paperId: '',
            pageNumber: currentPage,
            text: selectedText,
            comment,
            color: 'amber',
            type: 'note',
          });
          setSelectionPos(null);
        }}
        onTranslate={(text) => {
          onTranslateSelection(text);
          setSelectionPos(null);
        }}
        onAskAI={(text) => {
          onAskAISelection(text);
          setSelectionPos(null);
        }}
        onSaveToMemory={(text) => {
          onSaveToMemorySelection(text);
          setSelectionPos(null);
        }}
        onClose={() => setSelectionPos(null)}
      />

      {/* In-Paper Search Bar */}
      {showSearchBar && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30 bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in page..."
            autoFocus
            className="bg-transparent text-xs text-white outline-none w-48"
          />
          <button
            onClick={() => setShowSearchBar(false)}
            className="text-xs text-neutral-400 hover:text-white px-1"
          >
            Esc
          </button>
        </div>
      )}

      {/* Main Canvas Scroll Viewport */}
      <div className="flex-1 overflow-auto flex justify-center p-6 relative">
        <div className="relative inline-block shadow-2xl rounded-sm transition-all duration-150">
          {/* PDF Page Canvas */}
          <canvas ref={canvasRef} className="block bg-white shadow-lg" />

          {/* Text Layer for native selection */}
          <div
            ref={textLayerRef}
            className="absolute inset-0 pointer-events-auto overflow-hidden text-layer leading-none"
          />

          {/* Annotations & Margin Notes Pills for Current Page */}
          {pageAnnotations.length > 0 && (
            <div className="absolute -right-12 top-4 flex flex-col gap-2 pointer-events-auto">
              {pageAnnotations.map((anno) => (
                <div
                  key={anno.id}
                  title={`${anno.type}: ${anno.comment || anno.text}`}
                  className="w-7 h-7 rounded-full bg-neutral-900 border border-amber-500/50 flex items-center justify-center text-amber-400 text-xs shadow-md hover:scale-110 cursor-pointer transition-transform"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs z-20">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 hover:bg-neutral-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Previous Page (K / Left)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono text-neutral-400 px-1">
          <strong className="text-white">{currentPage}</strong> / {totalPages || 1}
        </span>

        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 hover:bg-neutral-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Next Page (J / Right)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-3.5 bg-neutral-700 mx-1" />

        <button
          onClick={() => onScaleChange(Math.max(scale - 0.15, 0.6))}
          className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onScaleChange(1.15)}
          className="px-1.5 py-0.5 hover:bg-neutral-800 rounded font-mono text-[11px] text-neutral-300 transition-colors"
          title="Reset Fit Width (0)"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={() => onScaleChange(Math.min(scale + 0.15, 2.5))}
          className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-neutral-700 mx-1" />

        <button
          onClick={() => setShowSearchBar((prev) => !prev)}
          className="p-1 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
          title="Find in page (Ctrl+F)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading overlay indicator */}
      {loading && (
        <div className="absolute top-4 right-4 bg-neutral-900/80 backdrop-blur border border-neutral-700 text-amber-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Rendering page...</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs px-4 py-2 rounded-xl shadow-xl">
          {error}
        </div>
      )}
    </div>
  );
};
