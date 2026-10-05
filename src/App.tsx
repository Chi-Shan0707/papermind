/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Annotation, PaperDocument } from './types/paper';
import { Header } from './components/Header';
import { PDFViewer } from './components/PDFViewer';
import { AISidebar } from './components/AISidebar';
import { SettingsModal } from './components/SettingsModal';
import { SamplePapersModal } from './components/SamplePapersModal';
import { MemoryManagerModal } from './components/MemoryManagerModal';
import { WindowsScriptModal } from './components/WindowsScriptModal';
import { TranslateModal } from './components/TranslateModal';
import { 
  getStoredAnnotations, 
  getStoredMemories, 
  getStoredPapers, 
  saveAnnotation, 
  savePDFData, 
  getPDFData,
  saveStoredPapers 
} from './services/storage';
import { SAMPLE_PAPERS, SamplePaperMeta, generateSamplePaperPDF } from './services/samplePapers';

export default function App() {
  // Current active paper and binary buffer
  const [currentPaper, setCurrentPaper] = useState<PaperDocument | null>(null);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [memoryCount, setMemoryCount] = useState<number>(getStoredMemories().length);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSamplePapersOpen, setIsSamplePapersOpen] = useState<boolean>(false);
  const [isMemoryManagerOpen, setIsMemoryManagerOpen] = useState<boolean>(false);
  const [isWindowsScriptOpen, setIsWindowsScriptOpen] = useState<boolean>(false);
  
  // Selection translation modal
  const [isTranslateOpen, setIsTranslateOpen] = useState<boolean>(false);
  const [translateText, setTranslateText] = useState<string>('');

  // External prompt passed from selection toolbar to AI chat
  const [externalChatPrompt, setExternalChatPrompt] = useState<string | undefined>();

  // Load initial paper on mount (e.g. MMD paper as starter)
  useEffect(() => {
    const papers = getStoredPapers();
    if (papers.length > 0) {
      const latest = papers[0];
      setCurrentPaper(latest);
      getPDFData(latest.id).then((buf) => {
        if (buf) {
          setPdfBuffer(buf);
          setAnnotations(getStoredAnnotations(latest.id));
        } else {
          loadDefaultSamplePaper();
        }
      });
    } else {
      loadDefaultSamplePaper();
    }
  }, []);

  const loadDefaultSamplePaper = () => {
    // Load the MMD paper by default as requested by user
    const defaultSample = SAMPLE_PAPERS[0];
    handleSelectSample(defaultSample);
  };

  // Load a file from user's computer via Drag-and-drop or File Picker
  const handleFileSelect = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const paperId = `paper-${Date.now()}`;
      const newDoc: PaperDocument = {
        id: paperId,
        title: file.name.replace(/\.pdf$/i, ''),
        authors: ['Local Document'],
        pageCount: 1,
        fileSize: file.size,
        fileName: file.name,
        lastOpened: Date.now(),
        currentPage: 1,
        currentScale: 1.2,
      };

      await savePDFData(paperId, buffer);
      
      const papers = getStoredPapers();
      const updated = [newDoc, ...papers.filter((p) => p.id !== paperId)];
      saveStoredPapers(updated);

      setCurrentPaper(newDoc);
      setPdfBuffer(buffer);
      setCurrentPage(1);
      setAnnotations([]);
    } catch (err) {
      console.error('Error loading file:', err);
      alert('Could not read the PDF file. Please try another file.');
    }
  };

  // Load a sample paper
  const handleSelectSample = (sample: SamplePaperMeta) => {
    const buffer = generateSamplePaperPDF(sample);
    const newDoc: PaperDocument = {
      id: sample.id,
      title: sample.title,
      authors: sample.authors,
      arxivId: sample.arxivId,
      pageCount: sample.sections.length > 2 ? 2 : 1,
      fileName: `${sample.title}.pdf`,
      lastOpened: Date.now(),
      currentPage: 1,
      currentScale: 1.2,
      summary: sample.summary,
    };

    savePDFData(sample.id, buffer);
    const papers = getStoredPapers();
    saveStoredPapers([newDoc, ...papers.filter((p) => p.id !== sample.id)]);

    setCurrentPaper(newDoc);
    setPdfBuffer(buffer);
    setCurrentPage(1);
    setAnnotations(getStoredAnnotations(sample.id));
  };

  // Fetch paper directly from arXiv
  const handleFetchArxiv = async (query: string) => {
    try {
      const cleanId = query
        .replace(/https?:\/\/arxiv\.org\/(abs|pdf)\//i, '')
        .replace(/\.pdf$/i, '')
        .trim();

      // First fetch metadata
      const infoRes = await fetch(`/api/arxiv/info?id=${encodeURIComponent(cleanId)}`);
      let meta: any = null;
      if (infoRes.ok) {
        meta = await infoRes.json();
      }

      // Then fetch PDF buffer
      const pdfRes = await fetch(`/api/arxiv/pdf?id=${encodeURIComponent(cleanId)}`);
      if (!pdfRes.ok) {
        throw new Error('Could not download PDF from arXiv');
      }

      const buffer = await pdfRes.arrayBuffer();
      const paperId = `arxiv-${cleanId}`;

      const newDoc: PaperDocument = {
        id: paperId,
        title: meta?.title || `arXiv:${cleanId}`,
        authors: meta?.authors || ['arXiv Authors'],
        arxivId: cleanId,
        pageCount: 1,
        fileName: `${cleanId}.pdf`,
        lastOpened: Date.now(),
        currentPage: 1,
        currentScale: 1.2,
        summary: meta?.summary || '',
      };

      await savePDFData(paperId, buffer);
      const papers = getStoredPapers();
      saveStoredPapers([newDoc, ...papers.filter((p) => p.id !== paperId)]);

      setCurrentPaper(newDoc);
      setPdfBuffer(buffer);
      setCurrentPage(1);
      setAnnotations(getStoredAnnotations(paperId));
    } catch (err: any) {
      console.error('arXiv fetch failed:', err);
      alert(`Could not fetch arXiv paper: ${err.message}. Please check arXiv ID or drop a local PDF.`);
    }
  };

  // Handle new annotation
  const handleAddAnnotation = (anno: Omit<Annotation, 'id' | 'createdAt'>) => {
    if (!currentPaper) return;
    const newAnnotation: Annotation = {
      ...anno,
      id: `anno-${Date.now()}`,
      paperId: currentPaper.id,
      createdAt: Date.now(),
    };
    saveAnnotation(newAnnotation);
    setAnnotations(getStoredAnnotations(currentPaper.id));
  };

  // Selection actions
  const handleTranslateSelection = (text: string) => {
    setTranslateText(text);
    setIsTranslateOpen(true);
  };

  const handleAskAISelection = (text: string) => {
    setIsSidebarOpen(true);
    setExternalChatPrompt(`Regarding this text from page ${currentPage}:\n"${text}"\n\nPlease explain its theoretical significance and mathematical intuition.`);
  };

  const handleSaveToMemorySelection = (text: string) => {
    setIsSidebarOpen(true);
    setExternalChatPrompt(`Please extract the core mathematical/theoretical concept from this excerpt and suggest a clean definition for my personal knowledge base:\n"${text}"`);
  };

  const handleExtractedText = useCallback((text: string) => {
    setCurrentPaper((prev) => (prev ? { ...prev, extractedText: text } : null));
  }, []);

  const refreshMemoriesCount = () => {
    setMemoryCount(getStoredMemories().length);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        currentPaper={currentPaper}
        onOpenSamplePapers={() => setIsSamplePapersOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemoryManager={() => setIsMemoryManagerOpen(true)}
        onOpenWindowsScript={() => setIsWindowsScriptOpen(true)}
        onFileSelect={handleFileSelect}
        onFetchArxiv={handleFetchArxiv}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        memoryCount={memoryCount}
      />

      {/* Main Split View: PDF Reader (Left) | AI Studio (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Document Canvas & Text Layer */}
        <PDFViewer
          pdfBuffer={pdfBuffer}
          currentPage={currentPage}
          scale={scale}
          annotations={annotations}
          onPageChange={(p) => setCurrentPage(p)}
          onScaleChange={(s) => setScale(s)}
          onAddAnnotation={handleAddAnnotation}
          onTranslateSelection={handleTranslateSelection}
          onAskAISelection={handleAskAISelection}
          onSaveToMemorySelection={handleSaveToMemorySelection}
          onFileDrop={handleFileSelect}
          onExtractedText={handleExtractedText}
        />

        {/* AI Copilot & Deconstruction Sidebar */}
        {isSidebarOpen && (
          <AISidebar
            currentPaper={currentPaper}
            annotations={annotations}
            currentPage={currentPage}
            onJumpToPage={(p) => setCurrentPage(p)}
            onRefreshAnnotations={() => {
              if (currentPaper) setAnnotations(getStoredAnnotations(currentPaper.id));
            }}
            externalPrompt={externalChatPrompt}
            onClearExternalPrompt={() => setExternalChatPrompt(undefined)}
          />
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => {}}
      />

      <SamplePapersModal
        isOpen={isSamplePapersOpen}
        onClose={() => setIsSamplePapersOpen(false)}
        onSelectSample={handleSelectSample}
      />

      <MemoryManagerModal
        isOpen={isMemoryManagerOpen}
        onClose={() => setIsMemoryManagerOpen(false)}
        onMemoryUpdated={refreshMemoriesCount}
      />

      <WindowsScriptModal
        isOpen={isWindowsScriptOpen}
        onClose={() => setIsWindowsScriptOpen(false)}
      />

      <TranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        selectedText={translateText}
        onMemoryUpdated={refreshMemoriesCount}
      />
    </div>
  );
}
