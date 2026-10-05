export interface PaperDocument {
  id: string;
  title: string;
  authors: string[];
  arxivId?: string;
  pageCount: number;
  fileSize?: number;
  fileName: string;
  lastOpened: number;
  currentPage: number;
  currentScale: number;
  extractedText?: string;
  summary?: string;
}

export type HighlightColor = 'yellow' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';

export interface Annotation {
  id: string;
  paperId: string;
  pageNumber: number;
  text: string;
  comment?: string;
  color: HighlightColor;
  type: 'highlight' | 'underline' | 'note';
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  term: string;
  definition: string;
  formula?: string;
  exampleOrAnalogy?: string;
  tags: string[];
  userNotes?: string;
  timesRecalled: number;
  createdAt: number;
  updatedAt: number;
}

export interface PaperDecomposition {
  title: string;
  oneSentenceSummary: string;
  coreInnovations: string[];
  mathematicalFormulation: {
    title: string;
    latex: string;
    plainExplanation: string;
    significance: string;
  }[];
  methodologySteps: string[];
  experimentalFindings: {
    datasetOrTask: string;
    baseline: string;
    result: string;
    implication: string;
  }[];
  limitationsAndRisks: string[];
  keyTerminology: {
    term: string;
    definition: string;
  }[];
  suggestedReadingOrder: {
    section: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  arxivDetails?: {
    arxivId: string;
    abstract: string;
    publishedDate: string;
    authors: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  referencedSelection?: string;
  recalledMemories?: string[];
  extractedMemoryCandidate?: Partial<MemoryItem>;
}

export interface AISettings {
  provider: 'server-gemini' | 'openrouter' | 'custom';
  openRouterApiKey: string;
  openRouterModel: string;
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
  language: 'zh' | 'en' | 'bilingual';
  mathDetailLevel: 'intuitive' | 'rigorous' | 'summary';
}
