import React, { useState } from 'react';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  X, 
  Monitor, 
  Globe, 
  ExternalLink,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

interface WindowsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsScriptModal: React.FC<WindowsScriptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const batScriptContent = `@echo off
title PaperMind - Minimalist Academic Paper Reader
echo =======================================================
echo    Starting PaperMind Local Desktop Reader...
echo =======================================================

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your Windows computer.
    echo Please install Node.js from https://nodejs.org/ (LTS version).
    pause
    exit /b
)

:: Install dependencies if not already present
if not exist node_modules (
    echo [INFO] Installing lightweight dependencies...
    call npm install
)

:: Launch the reader
echo [SUCCESS] Launching PaperMind server on port 3000...
start "" http://localhost:3000
npm run dev

pause
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(batScriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadBat = () => {
    const blob = new Blob([batScriptContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run_paper_reader.bat';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Windows Desktop & Offline Deployment</h3>
              <p className="text-[11px] text-neutral-400">Run directly on website or launch locally with a Windows script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Option 1: Web App (Zero Install) */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>方案 A: 直接在当前网页上使用 (推荐，零安装)</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                即开即用
              </span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              这个网站专为电脑桌面端阅读优化，不需要在电脑上安装任何复杂环境，直接把本地任何 PDF 文件拖入浏览器窗口即可阅读、划线高亮、做笔记和调用 AI 进行数学拆解！
            </p>
          </div>

          {/* Option 2: Windows 1-Click BAT Script */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>方案 B: Windows 一键启动脚本 (run_paper_reader.bat)</span>
              </span>
              <button
                onClick={handleDownloadBat}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>下载 .bat 脚本</span>
              </button>
            </div>

            <p className="text-neutral-400 text-[11px]">
              如果你想将项目保存在 Windows 电脑本地随时双击启动，只需运行下方的 Windows 批处理脚本：
            </p>

            {/* Script Code Block */}
            <div className="relative">
              <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-[10px] text-neutral-300 overflow-x-auto select-all leading-normal">
                {batScriptContent}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded border border-neutral-700 text-[10px] flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制脚本'}</span>
              </button>
            </div>
          </div>

          {/* Usage tips */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-1.5 text-neutral-400 text-[11px]">
            <div className="font-semibold text-neutral-200">💡 快捷阅读小贴士:</div>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><strong className="text-neutral-300">拖拽文件：</strong> 电脑桌面上的任意 PDF 直接拖进页面即可开始阅读。</li>
              <li><strong className="text-neutral-300">划线高亮：</strong> 鼠标划选文本，会自动弹出高亮、翻译、提问和存入记忆工具条。</li>
              <li><strong className="text-neutral-300">持久记忆：</strong> 所有关于 MMD、数学公式和概念的问答都会保存在个人知识库中。</li>
              <li><strong className="text-neutral-300">快捷键：</strong> 按 <kbd className="px-1 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[10px]">J</kbd> / <kbd className="px-1 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[10px]">K</kbd> 快速翻页，<kbd className="px-1 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[10px]">+</kbd> / <kbd className="px-1 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[10px]">-</kbd> 缩放页面。</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
          >
            知道了 (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
