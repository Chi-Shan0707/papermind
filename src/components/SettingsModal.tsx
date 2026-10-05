import React, { useState } from 'react';
import { AISettings } from '../types/paper';
import { getStoredSettings, saveStoredSettings } from '../services/storage';
import { sendChatMessage } from '../services/aiService';
import { 
  Settings, 
  Key, 
  Cpu, 
  Globe, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<AISettings>(getStoredSettings());
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredSettings(settings);
    onSettingsUpdated();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Sending ping to model...');
    try {
      saveStoredSettings(settings);
      const res = await sendChatMessage([
        { role: 'user', content: 'Respond with "PaperMind connection successful" in one sentence.' },
      ]);
      setTestStatus('success');
      setTestMessage(res.text.slice(0, 100));
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(err.message || 'Connection test failed');
    }
  };

  const openRouterModels = [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Reasoning & Math)', badge: 'Recommended' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (State-of-the-Art Research)', badge: 'Top Tier' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', badge: 'Fast & Open' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', badge: 'Ultra Fast' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Efficient' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI & OpenRouter Configuration</h3>
              <p className="text-[11px] text-neutral-400">Configure model provider, API keys, and math reasoning style</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs max-h-[75vh]">
          {/* Provider Selector */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center justify-between">
              <span>AI Provider Engine</span>
              <span className="text-[10px] text-emerald-400 font-medium">Gemini 2.5 Flash Connected</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'server-gemini' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  settings.provider === 'server-gemini'
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-white ring-1 ring-emerald-500/30'
                    : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300">Gemini (内置)</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[10px] text-neutral-400 leading-snug">
                  开箱即用，免配置 Key，直接调用 Gemini 进行论文解构与数学推导。
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'openrouter' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  settings.provider === 'openrouter'
                    ? 'border-amber-500/60 bg-amber-500/10 text-white ring-1 ring-amber-500/30'
                    : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300">OpenRouter</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] text-neutral-400 leading-snug">
                  使用个人 OpenRouter Key，切换 Claude 3.5、DeepSeek 等。
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'custom' })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  settings.provider === 'custom'
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white ring-1 ring-indigo-500/30'
                    : 'border-neutral-800 bg-neutral-950/50 text-neutral-400 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300">Custom / 本地</span>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10px] text-neutral-400 leading-snug">
                  自定义 OpenAI 兼容接口或电脑本地 Ollama 模型。
                </span>
              </button>
            </div>
          </div>

          {/* Gemini Built-in Notice */}
          {settings.provider === 'server-gemini' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-1 text-xs">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>当前已连接：服务端 Gemini AI 引擎</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                无需输入任何 API Key，后台直接使用 Gemini 2.5 Flash 提供高精度的论文结构拆解、公式推导、学术翻译以及个人知识库记忆（如 MMD、RKHS）同步！
              </p>
            </div>
          )}

          {/* OpenRouter Configuration */}
          {settings.provider === 'openrouter' && (
            <div className="space-y-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
              <div>
                <label className="block text-neutral-300 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>OpenRouter API Key</span>
                  </span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    Get API key ↗
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.openRouterApiKey}
                    onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-2 pr-9 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Stored securely in your local browser storage. Never sent to any external server except OpenRouter.
                </p>
              </div>

              {/* Model selection */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Selected Model
                </label>
                <select
                  value={settings.openRouterModel}
                  onChange={(e) => setSettings({ ...settings, openRouterModel: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                >
                  {openRouterModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.badge})
                    </option>
                  ))}
                  <option value="custom-input">Custom Model Name...</option>
                </select>

                {/* Custom model override input */}
                <input
                  type="text"
                  value={settings.openRouterModel}
                  onChange={(e) => setSettings({ ...settings, openRouterModel: e.target.value })}
                  placeholder="Or enter any OpenRouter model string (e.g. qwen/qwen-2.5-72b-instruct)"
                  className="w-full mt-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 outline-none font-mono focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Custom API Configuration */}
          {settings.provider === 'custom' && (
            <div className="space-y-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  value={settings.customBaseUrl}
                  onChange={(e) => setSettings({ ...settings, customBaseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.customApiKey}
                  onChange={(e) => setSettings({ ...settings, customApiKey: e.target.value })}
                  placeholder="API Key"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Model Name</label>
                <input
                  type="text"
                  value={settings.customModel}
                  onChange={(e) => setSettings({ ...settings, customModel: e.target.value })}
                  placeholder="e.g. gpt-4o, deepseek-chat"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Academic Style Preferences */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Response Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="zh">中文 (Chinese - Academic Standard)</option>
                <option value="en">English (Original Terminology)</option>
                <option value="bilingual">Bilingual (双语解析对照)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Math & Formula Style</label>
              <select
                value={settings.mathDetailLevel}
                onChange={(e) => setSettings({ ...settings, mathDetailLevel: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="intuitive">Intuitive & Geometric (Recommended)</option>
                <option value="rigorous">Rigorous (Theorems, Dimensions, Proofs)</option>
                <option value="summary">Summary (Inputs, Outputs & Role)</option>
              </select>
            </div>
          </div>

          {/* Test Connection Result */}
          {testStatus !== 'idle' && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                testStatus === 'testing'
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  : testStatus === 'success'
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
                  : 'bg-rose-950/80 text-rose-200 border-rose-800'
              }`}
            >
              {testStatus === 'testing' && (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              )}
              {testStatus === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
              {testStatus === 'failed' && <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
              <span className="leading-snug">{testMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
