"use client";
import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

const mockChatSettings = {
  system_prompt: 'You are ViralStudio AI, a helpful assistant specialized in content creation, social media marketing, viral video strategies, and AI-powered content generation. Provide concise, actionable advice.',
  default_model: 'OpenRouter Auto',
  credit_cost_per_message: 1,
  max_messages: { Free: 50, Creator: 500, Pro: 2000, Agency: 10000 },
  enabled: true,
};

const mockChatModels = [
  { id: 'cm_001', name: 'OpenRouter Auto', provider: 'OpenRouter', api_model: 'openrouter/auto', status: 'active' },
  { id: 'cm_002', name: 'GPT-4o Mini', provider: 'OpenRouter', api_model: 'openrouter/gpt-4o-mini', status: 'active' },
  { id: 'cm_003', name: 'Claude 3 Haiku', provider: 'OpenRouter', api_model: 'openrouter/claude-3-haiku', status: 'inactive' },
];

const mockPresets = [
  { id: 'preset_001', name: 'Content Strategy', description: 'Strategic planning for social media content calendars' },
  { id: 'preset_002', name: 'Script Optimizer', description: 'Optimize video scripts for maximum engagement' },
  { id: 'preset_003', name: 'Brand Voice', description: 'Develop and maintain consistent brand voice across content' },
];

function SectionCard({ title, subtitle, icon, children, className = "" }) {
  return (
    <div className={`glass-card rounded-xl p-4 card-glow ${className}`} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02), transparent)" }}>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-border/20">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-primary" size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toast({ message, visible }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 backdrop-blur-md">
        <Icon name="check_circle" size={14} />
        {message}
      </div>
    </div>
  );
}

export default function ChatAIAdmin() {
  const [settings, setSettings] = useState(mockChatSettings);
  const [models, setModels] = useState(mockChatModels);
  const [systemPrompt, setSystemPrompt] = useState(settings.system_prompt);
  const [creditCost, setCreditCost] = useState(settings.credit_cost_per_message);
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const toggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const saveSystemPrompt = () => {
    setSettings(prev => ({ ...prev, system_prompt: systemPrompt }));
    showToast();
  };

  const toggleModelStatus = (model) => {
    setModels(prev => prev.map(m => m.id === model.id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
  };

  const saveCreditCost = () => {
    setSettings(prev => ({ ...prev, credit_cost_per_message: creditCost }));
    showToast();
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Chat AI"
        subtitle="Manage chat models, system prompt, and settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Chat Status" subtitle="Global chat AI settings" icon="chat">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Enabled</span>
              <button onClick={toggleEnabled} className={`relative w-10 h-5 rounded-full transition-all ${settings.enabled ? 'bg-primary' : 'bg-surface-container-high'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Default Model</span>
              <span className="text-xs font-medium text-white">{settings.default_model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Credit Cost</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} value={creditCost} onChange={e => setCreditCost(Number(e.target.value))} className="w-16 bg-surface-container-low border border-surface-border/50 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary/50 transition-all" />
                <span className="text-xs text-on-surface-variant">cr / msg</span>
                <button onClick={saveCreditCost} className="px-2 py-1 primary-gradient text-white rounded-lg text-[10px] font-semibold hover:brightness-110 transition-all">Save</button>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-border/20">
            <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-2">Max Messages per Plan</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(settings.max_messages).map(([plan, count]) => (
                <div key={plan} className="bg-surface-container-low border border-surface-border/30 rounded-lg px-2.5 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-on-surface-variant">{plan}</span>
                  <span className="text-xs font-semibold text-white">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="System Prompt" subtitle="Default AI behavior instructions" icon="psychology" className="lg:col-span-2">
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={6} className="w-full bg-surface-container-low border border-surface-border/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-all resize-none" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[9px] text-on-surface-variant">{systemPrompt.length} characters</p>
            <button onClick={saveSystemPrompt} className="px-3.5 py-2 primary-gradient text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all">Save Prompt</button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Chat Models" subtitle="Available AI models for chat conversations" icon="smart_toy">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border/30">
                <th className="text-left py-2 pr-4 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Model Name</th>
                <th className="text-left py-2 pr-4 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Provider</th>
                <th className="text-left py-2 pr-4 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">API Model</th>
                <th className="text-left py-2 pr-4 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-right py-2 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id} className="border-b border-surface-border/10 last:border-0 hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-white">{model.name}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-on-surface-variant">{model.provider}</td>
                  <td className="py-2.5 pr-4">
                    <code className="text-[10px] font-mono bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant">{model.api_model}</code>
                  </td>
                  <td className="py-2.5 pr-4"><StatusBadge status={model.status} /></td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => toggleModelStatus(model)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      model.status === 'active' ? 'bg-error/10 text-error border border-error/20 hover:bg-error/20' : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                    }`}>
                      {model.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Presets" subtitle="Quick-start prompt presets for common tasks" icon="bookmark">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border/30">
                <th className="text-left py-2 pr-4 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Name</th>
                <th className="text-left py-2 text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              {mockPresets.map(preset => (
                <tr key={preset.id} className="border-b border-surface-border/10 last:border-0 hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-white">{preset.name}</span>
                  </td>
                  <td className="py-2.5 text-on-surface-variant">{preset.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Toast message="Settings saved successfully" visible={toastVisible} />
    </div>
  );
}
