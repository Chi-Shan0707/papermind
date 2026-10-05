import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(geminiApiKey),
    time: new Date().toISOString(),
  });
});

// Proxy arXiv PDF or TeX metadata to bypass CORS
app.get('/api/arxiv/info', async (req: Request, res: Response) => {
  try {
    const rawId = (req.query.id as string || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Missing arXiv id' });
    }
    // Clean id: e.g. 1706.03762 or abs/1706.03762
    const arxivId = rawId.replace(/^(arxiv:)?(abs\/|pdf\/)?/i, '').replace(/\.pdf$/i, '');
    
    // Fetch arXiv export API metadata
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'PaperMind-AcademicReader/1.0 (academic paper reader)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from arXiv' });
    }

    const xml = await response.text();
    
    // Parse simple XML fields
    const titleMatch = xml.match(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/);
    const summaryMatch = xml.match(/<entry>[\s\S]*?<summary>([\s\S]*?)<\/summary>/);
    const publishedMatch = xml.match(/<entry>[\s\S]*?<published>([\s\S]*?)<\/published>/);
    
    // Authors
    const authors: string[] = [];
    const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(xml)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Unknown Paper';
    const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
    const published = publishedMatch ? publishedMatch[1].trim() : '';

    return res.json({
      arxivId,
      title,
      summary,
      published,
      authors,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      texUrl: `https://arxiv.org/e-print/${arxivId}`
    });
  } catch (error: any) {
    console.error('arXiv info error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// Proxy arXiv PDF binary
app.get('/api/arxiv/pdf', async (req: Request, res: Response) => {
  try {
    const rawId = (req.query.id as string || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Missing arXiv id' });
    }
    const arxivId = rawId.replace(/^(arxiv:)?(abs\/|pdf\/)?/i, '').replace(/\.pdf$/i, '');
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PaperMind-AcademicReader/1.0'
      }
    });

    if (!pdfResponse.ok) {
      return res.status(pdfResponse.status).json({ error: 'Could not fetch arXiv PDF' });
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${arxivId}.pdf"`);
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('arXiv PDF proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI completion endpoint (uses server-side Gemini if available, or acts as fallback)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, userMemory } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'No server-side GEMINI_API_KEY configured. Please enter your OpenRouter API key in Settings.'
      });
    }

    // Build system instruction including user knowledge memory
    let fullSystemInstruction = systemInstruction || `You are PaperMind, an elite academic research assistant and mathematician copilot. You help researchers read papers, deconstruct formulas, explain complex math (like MMD, RKHS, variational inference, attention mechanisms), and synthesize insights.`;
    
    if (userMemory && Array.isArray(userMemory) && userMemory.length > 0) {
      fullSystemInstruction += `\n\n### USER PERSONAL KNOWLEDGE MEMORY (Retrieved Context):\nThe user has recurring questions and established knowledge in memory. Refer to this context when answering:\n`;
      userMemory.forEach((item: any) => {
        fullSystemInstruction += `- [${item.term}]: ${item.definition}${item.formula ? ` (Formula: ${item.formula})` : ''} ${item.userNotes ? `| User Notes: ${item.userNotes}` : ''}\n`;
      });
    }

    // Convert messages for @google/genai ensuring valid role alternation starting with user
    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') {
        // Skip leading model greetings
        continue;
      }
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += `\n\n${m.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: m.content }]
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello' }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
      }
    });

    const reply = response.text || '';
    return res.json({ reply });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: error.message || 'Error generating AI response' });
  }
});

// Setup Vite in development or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PaperMind server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
