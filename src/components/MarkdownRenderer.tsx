import React, { useMemo } from 'react';
import katex from 'katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Step 1: Protect and extract Math and Code Blocks
    const tokens: { id: string; html: string }[] = [];
    let tokenIndex = 0;

    const createToken = (html: string) => {
      const id = `%%TOKEN_${tokenIndex++}%%`;
      tokens.push({ id, html });
      return id;
    };

    let text = content;

    // 1.1 Protect Multi-line Code blocks ```...```
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const escaped = escapeHtml(code.trim());
      const block = `<pre class="my-2 p-3 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto"><code>${escaped}</code></pre>`;
      return createToken(block);
    });

    // 1.2 Protect Display Math: $$ ... $$ and \[ ... \]
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, math) => {
      const cleanMath = math.trim();
      let mathHtml = '';
      try {
        mathHtml = katex.renderToString(cleanMath, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        mathHtml = `<div class="font-mono text-xs text-neutral-300">$$ ${escapeHtml(cleanMath)} $$</div>`;
      }
      const container = `<div class="my-3 py-2 px-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg overflow-x-auto text-center flex justify-center items-center shadow-sm select-text">${mathHtml}</div>`;
      return createToken(container);
    });

    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => {
      const cleanMath = math.trim();
      let mathHtml = '';
      try {
        mathHtml = katex.renderToString(cleanMath, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        mathHtml = `<div class="font-mono text-xs text-neutral-300">$$ ${escapeHtml(cleanMath)} $$</div>`;
      }
      const container = `<div class="my-3 py-2 px-3 bg-neutral-900/60 border border-neutral-800/80 rounded-lg overflow-x-auto text-center flex justify-center items-center shadow-sm select-text">${mathHtml}</div>`;
      return createToken(container);
    });

    // 1.3 Protect Inline Math: $ ... $ and \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => {
      const cleanMath = math.trim();
      let mathHtml = '';
      try {
        mathHtml = katex.renderToString(cleanMath, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        mathHtml = `<code class="font-mono text-xs text-neutral-300">$${escapeHtml(cleanMath)}$</code>`;
      }
      return createToken(`<span class="inline-math px-0.5 select-text">${mathHtml}</span>`);
    });

    // Regex for inline $math$, ensuring not matching escaped \$ or currency like $50
    text = text.replace(/(^|[^\\])\$([^\$\n\r]+?)\$/g, (_match, prefix, math) => {
      const cleanMath = math.trim();
      // Skip if likely currency (e.g. just digits)
      if (/^\d+(\.\d+)?$/.test(cleanMath)) {
        return `${prefix}$${math}$`;
      }
      let mathHtml = '';
      try {
        mathHtml = katex.renderToString(cleanMath, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        mathHtml = `<code class="font-mono text-xs text-neutral-300">$${escapeHtml(cleanMath)}$</code>`;
      }
      return `${prefix}${createToken(`<span class="inline-math px-0.5 select-text">${mathHtml}</span>`)}`;
    });

    // 1.4 Protect Inline Code: `...`
    text = text.replace(/`([^`]+)`/g, (_match, code) => {
      return createToken(`<code class="px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-200 font-mono text-[11px] border border-neutral-700/50">${escapeHtml(code)}</code>`);
    });

    // Step 2: Parse Clean Markdown
    // Headings
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-neutral-100 mt-4 mb-1.5 tracking-tight">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-neutral-100 mt-5 mb-2 pb-1 border-b border-neutral-800/60 tracking-tight">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-neutral-100 mt-5 mb-2.5 tracking-tight">$1</h1>');

    // Bold & Italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-neutral-100">$1</strong>');
    text = text.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em class="italic text-neutral-300">$2</em>$3');

    // Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-neutral-600 pl-3 my-2 text-neutral-300 italic text-xs leading-relaxed">$1</blockquote>');

    // Lists
    text = text.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-neutral-300 my-0.5 text-xs leading-relaxed">$1</li>');
    text = text.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-neutral-300 my-0.5 text-xs leading-relaxed">$2</li>');

    // Paragraph breaks
    text = text.replace(/\n\n+/g, '<div class="h-2"></div>');
    text = text.replace(/\n/g, '<br/>');

    // Step 3: Re-inject tokens safely
    tokens.forEach(({ id, html }) => {
      text = text.replace(id, () => html);
    });

    return text;
  }, [content]);

  return (
    <div
      className={`text-xs leading-relaxed text-neutral-300 space-y-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
