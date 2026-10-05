import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Use matching unpkg/cdnjs worker
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Worker configuration notice:', e);
  }
}

export interface RenderPageOptions {
  pageNumber: number;
  scale: number;
  canvas: HTMLCanvasElement;
  textLayerDiv?: HTMLDivElement;
}

export class PDFDocumentHandler {
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  public totalPages: number = 0;
  public title: string = '';

  async loadFromBuffer(buffer: ArrayBuffer): Promise<number> {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('PDF ArrayBuffer is empty or detached');
    }
    // Always clone buffer so PDF.js worker transferring never detaches caller's buffer
    const safeBuffer = buffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(safeBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
      cMapPacked: true,
    });
    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;

    try {
      const meta = await this.pdfDoc.getMetadata();
      const info = meta.info as Record<string, any>;
      if (info && info.Title) {
        this.title = info.Title;
      }
    } catch {
      // ignore metadata extraction error
    }

    return this.totalPages;
  }

  async renderPage({ pageNumber, scale, canvas, textLayerDiv }: RenderPageOptions): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF document not loaded');

    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Handle high-DPI displays (retina screens)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const effectiveDpr = Math.min(dpr, 2.5); // Cap to preserve memory and high performance

    canvas.width = Math.floor(viewport.width * effectiveDpr);
    canvas.height = Math.floor(viewport.height * effectiveDpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.save();
    ctx.scale(effectiveDpr, effectiveDpr);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    // Render Text Layer using official PDF.js TextLayer for natural, pixel-perfect selection
    if (textLayerDiv) {
      textLayerDiv.innerHTML = '';
      textLayerDiv.className = 'pdf-text-layer textLayer';
      textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
      textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
      textLayerDiv.style.setProperty('--scale-factor', `${scale}`);

      try {
        const textContent = await page.getTextContent();
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
        });
        await textLayer.render();
      } catch (err) {
        console.warn('TextLayer render notice:', err);
      }
    }
  }

  /**
   * Extract all plain text across all pages for AI analysis and deconstruction
   */
  async extractFullText(maxPages = 15): Promise<string> {
    if (!this.pdfDoc) return '';
    const pagesToRead = Math.min(this.totalPages, maxPages);
    let fullText = '';

    for (let i = 1; i <= pagesToRead; i++) {
      try {
        const page = await this.pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
      } catch (e) {
        console.warn(`Could not extract text from page ${i}:`, e);
      }
    }

    return fullText;
  }
}
