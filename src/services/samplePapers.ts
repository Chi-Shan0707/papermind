/**
 * Sample Academic Papers with built-in PDF generator for instant testing
 */

export interface SamplePaperMeta {
  id: string;
  title: string;
  authors: string[];
  arxivId?: string;
  year: number;
  conferenceOrJournal: string;
  summary: string;
  keyTopics: string[];
  sections: { title: string; content: string[] }[];
}

export const SAMPLE_PAPERS: SamplePaperMeta[] = [
  {
    id: 'sample-mmd-kernel',
    title: 'A Kernel Two-Sample Test and Maximum Mean Discrepancy (MMD)',
    authors: ['Arthur Gretton', 'Karsten M. Borgwardt', 'Malte J. Rasch', 'Bernhard Schölkopf', 'Alexander Smola'],
    arxivId: '1207.1403',
    year: 2012,
    conferenceOrJournal: 'Journal of Machine Learning Research (JMLR)',
    summary: 'A statistical test to determine whether two samples are drawn from different distributions without parametric assumptions, using mean embeddings in Reproducing Kernel Hilbert Spaces (RKHS).',
    keyTopics: ['Maximum Mean Discrepancy (MMD)', 'RKHS', 'Kernel Methods', 'Two-Sample Testing', 'Hypothesis Testing'],
    sections: [
      {
        title: '1. Introduction & Motivation',
        content: [
          'Given two sets of independently drawn observations X = {x_1, ..., x_m} from distribution P, and Y = {y_1, ..., y_n} from distribution Q, the classical two-sample problem asks: Does P = Q?',
          'Parametric tests assume prior knowledge of the distribution families (e.g. Gaussian), while non-parametric tests based on empirical cumulative distributions suffer from severe curse of dimensionality in high dimensions.',
          'We propose Maximum Mean Discrepancy (MMD), a non-parametric metric measuring the distance between probability distributions represented as mean embeddings in a Reproducing Kernel Hilbert Space (RKHS).'
        ]
      },
      {
        title: '2. Formal Definition of MMD',
        content: [
          'Let F be a class of functions f: X -> R. The Maximum Mean Discrepancy between P and Q is defined as:',
          'MMD(F, P, Q) = sup_{f in F, ||f||_H <= 1} ( E_{x~P}[f(x)] - E_{y~Q}[f(y)] )',
          'When F is the unit ball in a reproducing kernel Hilbert space H with continuous reproducing kernel k(x, x\'), the squared MMD admits an exact kernelized expansion:',
          'MMD^2(P, Q) = E_{x,x\'~P}[k(x, x\')] - 2 E_{x~P, y~Q}[k(x, y)] + E_{y,y\'~Q}[k(y, y\')]',
          'Theorem 1: If the kernel k is universal (such as the Gaussian RBF kernel k(x, x\') = exp(-gamma ||x - x\'||^2)), then MMD(F, P, Q) = 0 if and only if P = Q.'
        ]
      },
      {
        title: '3. Unbiased Finite Sample Estimator',
        content: [
          'In practice, with empirical samples X and Y of sizes m and n, the unbiased estimator MMD_u^2 is computed by removing diagonal self-comparisons:',
          'MMD_u^2(X, Y) = 1/(m(m-1)) sum_{i != j} k(x_i, x_j) - 2/(mn) sum_{i,j} k(x_i, y_j) + 1/(n(n-1)) sum_{i != j} k(y_i, y_j)',
          'Under the null hypothesis H_0 (P = Q), m * MMD_u^2 converges asymptotically to an infinite sum of weighted chi-squared variables.'
        ]
      },
      {
        title: '4. Applications in Modern AI',
        content: [
          '1. MMD-GAN: Generative Adversarial Networks replacing the discriminator with an MMD loss penalty to prevent mode collapse.',
          '2. Domain Adaptation (DAN / Deep Coral): Minimizing MMD between deep representation layers of source domain and target domain.',
          '3. Deep Autoencoders (InfoVAE): Matching latent distribution q(z) to Gaussian prior p(z) via MMD penalty.'
        ]
      }
    ]
  },
  {
    id: 'sample-transformer-attention',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
    arxivId: '1706.03762',
    year: 2017,
    conferenceOrJournal: 'NeurIPS 2017',
    summary: 'Proposes the Transformer, a novel sequence transduction architecture based entirely on multi-head self-attention mechanisms, dispensing with recurrence and convolutions entirely.',
    keyTopics: ['Transformer', 'Self-Attention', 'Scaled Dot-Product', 'Multi-Head Attention', 'Positional Encoding'],
    sections: [
      {
        title: '1. Introduction',
        content: [
          'Recurrent neural networks (RNN, LSTM, GRU) have been firmly established as state-of-the-art approaches in sequence modeling. However, their inherently sequential computation precludes parallelization within training examples.',
          'The Transformer architecture eschews recurrence and instead relies entirely on an attention mechanism to draw global dependencies between input and output representations.'
        ]
      },
      {
        title: '2. Scaled Dot-Product Attention',
        content: [
          'An attention function can be described as mapping a query and a set of key-value pairs to an output. We compute the matrix of outputs as:',
          'Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V',
          'The scaling factor 1 / sqrt(d_k) counteracts the effect of large dot products pushing the softmax function into regions with extremely small gradients.'
        ]
      },
      {
        title: '3. Multi-Head Attention',
        content: [
          'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions:',
          'MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W^O',
          'where head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V).'
        ]
      }
    ]
  },
  {
    id: 'sample-lora',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'],
    arxivId: '2106.09685',
    year: 2021,
    conferenceOrJournal: 'ICLR 2022',
    summary: 'Freezes pre-trained model weights and injects trainable rank decomposition matrices into each layer, reducing trainable parameters by 10,000x without inference latency.',
    keyTopics: ['Parameter-Efficient Fine-Tuning (PEFT)', 'Low-Rank Adaptation', 'LLMs', 'Matrix Factorization'],
    sections: [
      {
        title: '1. Problem Statement',
        content: [
          'Full fine-tuning of 175B-parameter models requires updating and storing all parameters for each downstream task. This is computationally prohibitive.',
          'We hypothesize that the weight updates Delta W during adaptation have a low "intrinsic dimension".'
        ]
      },
      {
        title: '2. The LoRA Parameterization',
        content: [
          'For a pre-trained weight matrix W_0 in R^{d x k}, we constrain its update by representing Delta W = B * A, where B in R^{d x r}, A in R^{r x k}, and the rank r << min(d, k).',
          'The modified forward pass computes: h = W_0 * x + (alpha / r) * B * A * x.',
          'During training, W_0 is frozen and does not receive gradient updates, while A and B contain trainable parameters.'
        ]
      }
    ]
  }
];

/**
 * Generates a valid standard PDF binary (PDF-1.4) containing formatted text and typography
 */
export function generateSamplePaperPDF(sample: SamplePaperMeta): ArrayBuffer {
  // Construct a minimal valid PDF-1.4 document with pages and text
  const pagesData: string[] = [];

  // Page 1: Title, Authors, Abstract, Section 1 & Section 2
  let stream1 = `BT
/F1 18 Tf
50 780 Td
(${escapePdfString(sample.title)}) Tj
0 -26 Td
/F2 10 Tf
(${escapePdfString(sample.authors.join(', '))}) Tj
0 -16 Td
/F2 9 Tf
(${escapePdfString(`${sample.conferenceOrJournal} (${sample.year}) - arXiv:${sample.arxivId || 'N/A'}`)}) Tj
0 -28 Td
/F1 11 Tf
(ABSTRACT) Tj
0 -16 Td
/F3 9.5 Tf
(${escapePdfString(sample.summary)}) Tj
0 -30 Td
`;

  sample.sections.slice(0, 2).forEach((sec) => {
    stream1 += `/F1 12 Tf\n(${escapePdfString(sec.title)}) Tj\n0 -18 Td\n/F2 9.5 Tf\n`;
    sec.content.forEach((line) => {
      // Split long lines
      const chunks = wrapText(line, 80);
      chunks.forEach((chunk) => {
        stream1 += `(${escapePdfString(chunk)}) Tj\n0 -14 Td\n`;
      });
      stream1 += `0 -6 Td\n`;
    });
    stream1 += `0 -12 Td\n`;
  });
  stream1 += `ET`;

  pagesData.push(stream1);

  // Page 2: Remaining sections & Mathematical detail
  if (sample.sections.length > 2) {
    let stream2 = `BT
/F1 14 Tf
50 780 Td
(${escapePdfString(`${sample.title} (Continued)`)}) Tj
0 -30 Td
`;
    sample.sections.slice(2).forEach((sec) => {
      stream2 += `/F1 12 Tf\n(${escapePdfString(sec.title)}) Tj\n0 -18 Td\n/F2 9.5 Tf\n`;
      sec.content.forEach((line) => {
        const chunks = wrapText(line, 80);
        chunks.forEach((chunk) => {
          stream2 += `(${escapePdfString(chunk)}) Tj\n0 -14 Td\n`;
        });
        stream2 += `0 -6 Td\n`;
      });
      stream2 += `0 -14 Td\n`;
    });

    // Add references box
    stream2 += `/F1 11 Tf\n(REFERENCES & FURTHER READING) Tj\n0 -16 Td\n/F2 8.5 Tf\n`;
    stream2 += `([1] Gretton et al. A Kernel Two-Sample Test. JMLR, 13:723-773, 2012.) Tj\n0 -12 Td\n`;
    stream2 += `([2] Vaswani et al. Attention is all you need. NeurIPS, 30:5998-6008, 2017.) Tj\n0 -12 Td\n`;
    stream2 += `([3] Hu et al. LoRA: Low-Rank Adaptation of Large Language Models. ICLR, 2022.) Tj\nET`;

    pagesData.push(stream2);
  }

  return assemblePdf(pagesData);
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(text: string, maxLen = 80): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';

  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxLen) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur += ' ' + w;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

/**
 * Minimal standard PDF assembler in pure JS
 */
function assemblePdf(pagesStreams: string[]): ArrayBuffer {
  const objects: string[] = [];
  let objCount = 0;

  function addObj(content: string): number {
    objCount++;
    objects.push(`${objCount} 0 obj\n${content}\nendobj\n`);
    return objCount;
  }

  // 1: Catalog
  // 2: Pages
  // 3: Font Times-Bold
  // 4: Font Times-Roman
  // 5: Font Times-Italic

  const catalogId = 1;
  const pagesId = 2;
  const font1Id = 3;
  const font2Id = 4;
  const font3Id = 5;

  objCount = 5; // Reserve for catalog, pages, fonts

  const pageObjIds: number[] = [];

  pagesStreams.forEach((streamContent) => {
    const streamLen = streamContent.length;
    const streamObjId = addObj(`<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`);
    const pageObjId = addObj(`<<
/Type /Page
/Parent ${pagesId} 0 R
/MediaBox [0 0 612 842]
/Contents ${streamObjId} 0 R
/Resources <<
  /Font <<
    /F1 ${font1Id} 0 R
    /F2 ${font2Id} 0 R
    /F3 ${font3Id} 0 R
  >>
>>
>>`);
    pageObjIds.push(pageObjId);
  });

  // Now create the reserved 1 to 5 objects
  const catalogObj = `1 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`;
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj\n`;
  const font1Obj = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;
  const font2Obj = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const font3Obj = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`;

  const allObjs = [catalogObj, pagesObj, font1Obj, font2Obj, font3Obj, ...objects];

  // Calculate offsets for xref table
  let pdfString = `%PDF-1.4\n`;
  const offsets: number[] = [0];

  allObjs.forEach((obj) => {
    offsets.push(pdfString.length);
    pdfString += obj;
  });

  const xrefOffset = pdfString.length;
  pdfString += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdfString += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdfString += `trailer\n<< /Size ${offsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const buffer = new ArrayBuffer(pdfString.length);
  const uint8 = new Uint8Array(buffer);
  for (let i = 0; i < pdfString.length; i++) {
    uint8[i] = pdfString.charCodeAt(i) & 0xff;
  }
  return buffer;
}
