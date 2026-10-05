import React, { useState, useEffect, useRef } from 'react';
import { 
  Annotation, 
  ChatMessage, 
  MemoryItem, 
  PaperDecomposition, 
  PaperDocument 
} from '../types/paper';
import { 
  decomposePaper, 
  sendChatMessage 
} from '../services/aiService';
import { 
  addOrUpdateMemory, 
  deleteAnnotation, 
  deleteMemory, 
  getStoredMemories 
} from '../services/storage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  ArrowUp, 
  RotateCw, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  Download,
  ExternalLink
} from 'lucide-react';

interface AISidebarProps {
  currentPaper: PaperDocument | null;
  annotations: Annotation[];
  currentPage: number;
  onJumpToPage: (page: number) => void;
  onRefreshAnnotations: () => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  currentPaper,
  annotations,
  currentPage,
  onJumpToPage,
  onRefreshAnnotations,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  // Focus remains entirely on conversation flow by default
  const [activeTab, setActiveTab] = useState<'chat' | 'deconstruct' | 'memory' | 'annotations'>('chat');
  
  // Deconstruction state
  const [decomposition, setDecomposition] = useState<PaperDecomposition | null>(null);
  const [isDecomposing, setIsDecomposing] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Paper context loaded. Ask about formulas, proofs, baselines, or translations. Concepts you discuss are automatically retained in memory.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memory state
  const [memories, setMemories] = useState<MemoryItem[]>(getStoredMemories());
  const [memorySearch, setMemorySearch] = useState('');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [savedCandidateId, setSavedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    setMemories(getStoredMemories());
  }, [activeTab]);

  useEffect(() => {
    if (externalPrompt) {
      setActiveTab('chat');
      handleSendQuery(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt, onClearExternalPrompt]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleTriggerDecomposition = async () => {
    if (!currentPaper) return;
    setIsDecomposing(true);
    try {
      const result = await decomposePaper(
        currentPaper.title,
        currentPaper.extractedText || currentPaper.summary || '',
        currentPaper.arxivId
      );
      setDecomposition(result);
    } catch (e) {
      console.error('Decomposition error:', e);
    } finally {
      setIsDecomposing(false);
    }
  };

  useEffect(() => {
    if (currentPaper && !decomposition && !isDecomposing) {
      handleTriggerDecomposition();
    }
  }, [currentPaper?.id]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsSending(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: textToSend.trim() });

      const response = await sendChatMessage(history, {
        title: currentPaper?.title || '',
        text: currentPaper?.extractedText || '',
        arxivId: currentPaper?.arxivId,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
        recalledMemories: response.recalledMemories,
        extractedMemoryCandidate: response.memoryCandidate,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.recalledMemories.length > 0) {
        setMemories(getStoredMemories());
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `Failed: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveMemoryCandidate = (candidate: Partial<MemoryItem>) => {
    if (!candidate.term || !candidate.definition) return;
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      term: candidate.term,
      definition: candidate.definition,
      formula: candidate.formula || '',
      tags: candidate.tags || ['Mathematics'],
      timesRecalled: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addOrUpdateMemory(newItem);
    setMemories(getStoredMemories());
    setSavedCandidateId(candidate.term);
  };

  const handleAddCustomMemory = () => {
    if (!newTerm.trim() || !newDef.trim()) return;
    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      term: newTerm.trim(),
      definition: newDef.trim(),
      formula: newFormula.trim() || undefined,
      tags: ['Mathematics'],
      timesRecalled: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addOrUpdateMemory(item);
    setMemories(getStoredMemories());
    setNewTerm('');
    setNewDef('');
    setNewFormula('');
    setShowAddMemory(false);
  };

  const filteredMemories = memories.filter((m) => {
    const q = memorySearch.toLowerCase();
    return (
      m.term.toLowerCase().includes(q) ||
      m.definition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-[370px] flex flex-col h-full bg-neutral-900 border-l border-neutral-800/40 text-neutral-300 select-none font-sans text-xs">
      {/* Compact Monochromatic Tab Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/40 px-3 py-1.5 bg-neutral-900 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'chat'
                ? 'text-neutral-100 font-medium bg-neutral-800/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Copilot
          </button>
          <button
            onClick={() => setActiveTab('deconstruct')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'deconstruct'
                ? 'text-neutral-100 font-medium bg-neutral-800/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Deconstruct
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'memory'
                ? 'text-neutral-100 font-medium bg-neutral-800/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Memory ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('annotations')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'annotations'
                ? 'text-neutral-100 font-medium bg-neutral-800/70'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Notes ({annotations.length})
          </button>
        </div>

        {activeTab === 'deconstruct' && (
          <button
            onClick={handleTriggerDecomposition}
            disabled={isDecomposing}
            className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-30"
            title="Re-run analysis"
          >
            <RotateCw className={`w-3 h-3 ${isDecomposing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tab 1: COPILOT CHAT (Primary focus on conversation flow) */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 select-text">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Quiet recalled memory note without badges */}
                {msg.recalledMemories && msg.recalledMemories.length > 0 && (
                  <div className="mb-0.5 text-[10px] text-neutral-500 font-mono">
                    recalled: {msg.recalledMemories.join(', ')}
                  </div>
                )}

                {/* Message Body */}
                {msg.role === 'user' ? (
                  <div className="bg-neutral-800/80 border border-neutral-750/40 text-neutral-100 rounded-lg px-3 py-1.5 text-xs max-w-[88%] leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="w-full text-neutral-200 text-xs leading-relaxed select-text py-0.5">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}

                {/* Subtle Inline Concept Action if detected */}
                {msg.extractedMemoryCandidate && (
                  <div className="mt-1 flex items-center justify-between w-full text-[11px] border-t border-neutral-800/30 pt-1 text-neutral-400">
                    <span className="truncate mr-2 font-mono">
                      concept: {msg.extractedMemoryCandidate.term}
                    </span>
                    <button
                      onClick={() => handleSaveMemoryCandidate(msg.extractedMemoryCandidate!)}
                      disabled={savedCandidateId === msg.extractedMemoryCandidate.term}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors font-mono shrink-0"
                    >
                      {savedCandidateId === msg.extractedMemoryCandidate.term ? (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Check className="w-3 h-3" /> saved
                        </span>
                      ) : (
                        '+ pin to memory'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="text-neutral-500 text-[11px] font-mono py-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-ping" />
                <span>generating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Chips */}
          <div className="px-3 py-1 flex items-center gap-1 overflow-x-auto border-t border-neutral-800/30 bg-neutral-900/60 shrink-0">
            <button
              onClick={() => handleSendQuery('Explain the mathematical formula in Section 2 with intuition and LaTeX.')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-750/30 transition-colors"
            >
              Explain Math
            </button>
            <button
              onClick={() => handleSendQuery('What is MMD in mathematics and how is it used in this paper?')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-750/30 transition-colors"
            >
              What is MMD?
            </button>
            <button
              onClick={() => handleSendQuery('用中文简要总结论文的核心贡献与推导结论。')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-750/30 transition-colors"
            >
              中文总结
            </button>
          </div>

          {/* Minimal Chat Input */}
          <div className="p-2.5 border-t border-neutral-800/40 bg-neutral-900 shrink-0">
            <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800/50 rounded-lg px-2.5 py-1.5 focus-within:border-neutral-700 transition-colors">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendQuery()}
                placeholder="Ask about paper formulas or concepts..."
                disabled={isSending}
                className="flex-1 bg-transparent text-xs text-neutral-200 outline-none placeholder:text-neutral-500 font-sans"
              />
              <button
                onClick={() => handleSendQuery()}
                disabled={!inputText.trim() || isSending}
                className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-20 transition-colors"
                title="Send"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: DECONSTRUCTION */}
      {activeTab === 'deconstruct' && (
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 select-text">
          {isDecomposing ? (
            <div className="py-16 text-center text-neutral-500 font-mono text-[11px]">
              deconstructing paper structure...
            </div>
          ) : decomposition ? (
            <div className="space-y-4 text-xs">
              {/* Thesis */}
              <div className="border-l border-neutral-700 pl-2.5 py-0.5">
                <div className="text-[10px] uppercase font-mono text-neutral-400 mb-0.5">
                  Thesis
                </div>
                <p className="text-neutral-200 font-serif leading-relaxed text-[12.5px]">
                  "{decomposition.oneSentenceSummary}"
                </p>
              </div>

              {/* arXiv ID */}
              {currentPaper?.arxivId && (
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono py-1 border-b border-neutral-800/30">
                  <span>arXiv:{currentPaper.arxivId}</span>
                  <a
                    href={`https://arxiv.org/abs/${currentPaper.arxivId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-neutral-200"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Innovations */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-mono text-neutral-400">
                  Innovations
                </div>
                <ul className="space-y-1 text-neutral-300">
                  {decomposition.coreInnovations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <span className="font-mono text-neutral-400 text-[10px] mt-0.5">{idx + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formulas */}
              {decomposition.mathematicalFormulation && decomposition.mathematicalFormulation.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[10px] uppercase font-mono text-neutral-400">
                    Formulations & Loss Functions
                  </div>
                  {decomposition.mathematicalFormulation.map((math, idx) => (
                    <div key={idx} className="border border-neutral-800/50 rounded p-2.5 bg-neutral-950/30 space-y-1.5">
                      <div className="font-medium text-neutral-200 text-xs">{math.title}</div>
                      <MarkdownRenderer content={`$$${math.latex}$$`} />
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        {math.plainExplanation}
                      </p>
                      <div className="flex justify-end pt-0.5">
                        <button
                          onClick={() =>
                            handleSaveMemoryCandidate({
                              term: math.title,
                              definition: math.plainExplanation,
                              formula: math.latex,
                            })
                          }
                          className="text-[10px] text-neutral-400 hover:text-neutral-200 font-mono"
                        >
                          + save formula
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Baselines */}
              {decomposition.experimentalFindings && decomposition.experimentalFindings.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-neutral-400">
                    Baselines & Results
                  </div>
                  <div className="space-y-1.5">
                    {decomposition.experimentalFindings.map((exp, idx) => (
                      <div key={idx} className="border-l border-neutral-750 pl-2 py-0.5 text-neutral-300 space-y-0.5">
                        <div className="font-medium text-[11px] text-neutral-200">{exp.datasetOrTask}</div>
                        <div className="text-neutral-400 text-[11px]">
                          vs. {exp.baseline}: <span className="font-mono text-neutral-200">{exp.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {decomposition.limitationsAndRisks && decomposition.limitationsAndRisks.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-neutral-400">
                    Limitations
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-neutral-400 text-[11px]">
                    {decomposition.limitationsAndRisks.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-neutral-500 text-xs">
              Open a paper to deconstruct structure.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: KNOWLEDGE MEMORY */}
      {activeTab === 'memory' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3 select-text space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-neutral-400">
              Knowledge Memory ({memories.length})
            </span>
            <button
              onClick={() => setShowAddMemory(!showAddMemory)}
              className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              + new
            </button>
          </div>

          {/* Minimal Search Input */}
          <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800/40 rounded px-2 py-1 text-xs">
            <Search className="w-3 h-3 text-neutral-500" />
            <input
              type="text"
              value={memorySearch}
              onChange={(e) => setMemorySearch(e.target.value)}
              placeholder="Search concepts (e.g. MMD, RKHS)..."
              className="bg-transparent text-xs text-neutral-200 outline-none flex-1 placeholder:text-neutral-600 font-sans"
            />
          </div>

          {/* New concept form */}
          {showAddMemory && (
            <div className="border border-neutral-800/60 rounded p-2.5 space-y-1.5 bg-neutral-950/50 text-xs">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g. MMD)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none"
              />
              <textarea
                value={newDef}
                onChange={(e) => setNewDef(e.target.value)}
                placeholder="Definition & intuition..."
                rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none"
              />
              <input
                type="text"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                placeholder="LaTeX Formula (optional)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none font-mono"
              />
              <div className="flex justify-end gap-2 pt-1 text-[11px]">
                <button
                  onClick={() => setShowAddMemory(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomMemory}
                  className="text-neutral-200 hover:text-white font-mono"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredMemories.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                No matching concept found.
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="border border-neutral-800/40 rounded p-2.5 space-y-1 bg-neutral-950/20 group hover:border-neutral-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-neutral-100 text-xs">
                      {mem.term}
                    </span>
                    <button
                      onClick={() => {
                        deleteMemory(mem.id);
                        setMemories(getStoredMemories());
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-neutral-300 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    {mem.definition}
                  </p>

                  {mem.formula && (
                    <MarkdownRenderer content={`$$${mem.formula}$$`} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: ANNOTATIONS & NOTES */}
      {activeTab === 'annotations' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3 select-text space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-neutral-400">
              Notes ({annotations.length})
            </span>
            {annotations.length > 0 && (
              <button
                onClick={() => {
                  const md = annotations
                    .map(
                      (a) =>
                        `### Page ${a.pageNumber}\n> "${a.text}"\n${
                          a.comment ? `Note: ${a.comment}\n` : ''
                        }`
                    )
                    .join('\n\n');
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `annotations.md`;
                  a.click();
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-200 font-mono"
              >
                Export MD
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {annotations.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Select text in paper to highlight or annotate.
              </div>
            ) : (
              annotations.map((anno) => (
                <div
                  key={anno.id}
                  onClick={() => onJumpToPage(anno.pageNumber)}
                  className="border border-neutral-800/40 rounded p-2.5 space-y-1 cursor-pointer hover:border-neutral-700 bg-neutral-950/20 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>p. {anno.pageNumber}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(anno.id);
                        onRefreshAnnotations();
                      }}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <blockquote className="text-[11px] text-neutral-300 italic border-l border-neutral-700 pl-2 leading-relaxed">
                    "{anno.text}"
                  </blockquote>

                  {anno.comment && (
                    <div className="text-[11px] text-neutral-200 pl-2">
                      {anno.comment}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
