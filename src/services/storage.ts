import { Annotation, MemoryItem, PaperDocument, AISettings } from '../types/paper';

const DB_NAME = 'papermind_db';
const STORE_NAME = 'pdf_files';
const DB_VERSION = 1;

// IndexedDB initialization for PDF blobs
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePDFData(id: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPDFData(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePDFData(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// LocalStorage helpers
const PAPERS_KEY = 'papermind_papers';
const ANNOTATIONS_KEY = 'papermind_annotations';
const MEMORY_KEY = 'papermind_memory';
const SETTINGS_KEY = 'papermind_settings';

export function getStoredPapers(): PaperDocument[] {
  try {
    const raw = localStorage.getItem(PAPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPapers(papers: PaperDocument[]): void {
  try {
    localStorage.setItem(PAPERS_KEY, JSON.stringify(papers));
  } catch (e) {
    console.error('Failed to save papers metadata:', e);
  }
}

export function getStoredAnnotations(paperId: string): Annotation[] {
  try {
    const raw = localStorage.getItem(ANNOTATIONS_KEY);
    const all: Annotation[] = raw ? JSON.parse(raw) : [];
    return all.filter((a) => a.paperId === paperId);
  } catch {
    return [];
  }
}

export function saveAnnotation(annotation: Annotation): void {
  try {
    const raw = localStorage.getItem(ANNOTATIONS_KEY);
    const all: Annotation[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex((a) => a.id === annotation.id);
    if (index >= 0) {
      all[index] = annotation;
    } else {
      all.unshift(annotation);
    }
    localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save annotation:', e);
  }
}

export function deleteAnnotation(id: string): void {
  try {
    const raw = localStorage.getItem(ANNOTATIONS_KEY);
    const all: Annotation[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((a) => a.id !== id);
    localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete annotation:', e);
  }
}

// Default academic memories requested by user (e.g. MMD in mathematics)
const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-mmd-math',
    term: 'MMD (Maximum Mean Discrepancy)',
    definition: 'A non-parametric statistical distance measure between two probability distributions P and Q, defined as the distance between their mean embeddings in a Reproducing Kernel Hilbert Space (RKHS).',
    formula: 'MMD²(P, Q) = E_{x,x\'~P}[k(x,x\')] - 2E_{x~P, y~Q}[k(x,y)] + E_{y,y\'~Q}[k(y,y\')]',
    exampleOrAnalogy: 'Think of taking infinite statistical moments (mean, variance, skewness, etc.) and projecting them into a smooth geometric space using a kernel function (like RBF/Gaussian). If MMD=0, P=Q.',
    tags: ['Mathematics', 'Statistics', 'Kernel Methods', 'Generative Models'],
    userNotes: 'User frequently asks about this! Crucial in Two-Sample Tests, GAN training (MMD-GAN), and domain adaptation.',
    timesRecalled: 5,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'mem-rkhs',
    term: 'RKHS (Reproducing Kernel Hilbert Space)',
    definition: 'A Hilbert space of functions where evaluation at any point is a continuous linear functional, represented as an inner product with a kernel function: f(x) = ⟨f, k(·, x)⟩.',
    formula: 'f(x) = ⟨f, k(·, x)⟩_H  and  k(x, y) = ⟨k(·, x), k(·, y)⟩_H',
    exampleOrAnalogy: 'Allows computing infinite-dimensional dot products in a high-dimensional feature space without ever explicitly computing the coordinate transformations (the kernel trick).',
    tags: ['Mathematics', 'Functional Analysis', 'Machine Learning'],
    userNotes: 'Underpins Support Vector Machines (SVM), Gaussian Processes, and MMD theory.',
    timesRecalled: 3,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'mem-kl-div',
    term: 'KL Divergence (Kullback-Leibler)',
    definition: 'A non-symmetric measure of the difference between probability distributions P and Q, measuring the expected excess surprise when coding with Q instead of true P.',
    formula: 'D_KL(P || Q) = ∫ p(x) log(p(x) / q(x)) dx',
    exampleOrAnalogy: 'Relative entropy; 0 if and only if P=Q almost everywhere, but asymmetric (D_KL(P||Q) ≠ D_KL(Q||P)).',
    tags: ['Information Theory', 'Probability', 'Loss Functions'],
    userNotes: 'Core component in VAE (Variational Autoencoder) ELBO loss and policy gradient algorithms.',
    timesRecalled: 2,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  }
];

export function getStoredMemories(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(DEFAULT_MEMORIES));
      return DEFAULT_MEMORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMORIES;
  }
}

export function saveStoredMemories(memories: MemoryItem[]): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  } catch (e) {
    console.error('Failed to save memories:', e);
  }
}

export function addOrUpdateMemory(item: MemoryItem): void {
  const memories = getStoredMemories();
  const existingIdx = memories.findIndex(
    (m) => m.id === item.id || m.term.toLowerCase() === item.term.toLowerCase()
  );
  if (existingIdx >= 0) {
    memories[existingIdx] = {
      ...memories[existingIdx],
      ...item,
      timesRecalled: (memories[existingIdx].timesRecalled || 0) + 1,
      updatedAt: Date.now()
    };
  } else {
    memories.unshift({
      ...item,
      timesRecalled: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  saveStoredMemories(memories);
}

export function deleteMemory(id: string): void {
  const memories = getStoredMemories();
  saveStoredMemories(memories.filter((m) => m.id !== id));
}

// AI Settings persistence
export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'server-gemini',
  openRouterApiKey: '',
  openRouterModel: 'deepseek/deepseek-chat',
  customBaseUrl: 'https://openrouter.ai/api/v1',
  customApiKey: '',
  customModel: 'anthropic/claude-3.5-sonnet',
  language: 'zh',
  mathDetailLevel: 'intuitive',
};

export function getStoredSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_AI_SETTINGS, ...parsed };
    // If provider is set to openrouter but no key exists, default to server-gemini
    if (merged.provider === 'openrouter' && !merged.openRouterApiKey) {
      merged.provider = 'server-gemini';
    }
    return merged;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveStoredSettings(settings: AISettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
