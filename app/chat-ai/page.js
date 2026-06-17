"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { SidebarProvider } from "../components/SidebarContext";
import { useTranslate } from "../components/LanguageProvider";

const MODEL_OPTIONS = [
  { label: "Auto (recommended)", value: "openrouter/free", desc: "Best free model available" },
  { label: "Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct:free", desc: "Strong all-rounder, Meta's best" },
  { label: "Llama 3.2 3B", value: "meta-llama/llama-3.2-3b-instruct:free", desc: "Fast & lightweight, best for speed" },
  { label: "GPT-OSS-120B", value: "openai/gpt-oss-120b:free", desc: "OpenAI open-source, capable & free" },
];

const STORAGE_KEY = "viralstudio_chat_messages";

const SYSTEM_PROMPT = `You are ViralStudio AI, an expert creative assistant specializing in video production, scriptwriting, and content strategy. Help users craft detailed video prompts, optimize scripts, generate hook ideas, and plan content strategies. Be concise and practical.`;

function Markdown({ content }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) return <code className="px-1.5 py-0.5 bg-surface-container-high rounded text-xs text-primary font-mono" {...props}>{children}</code>;
          return (
            <div className="relative group my-3">
              <pre className="bg-surface-container-high border border-surface-border rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code className={className} {...props}>{children}</code></pre>
              <button onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-surface-container-low border border-surface-border rounded flex items-center justify-center hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[10px] text-on-surface-variant">content_copy</span>
              </button>
            </div>
          );
        },
        a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">{children}</a>; },
        ul({ children }) { return <ul className="list-disc list-inside space-y-1 my-2 text-sm text-white/90">{children}</ul>; },
        ol({ children }) { return <ol className="list-decimal list-inside space-y-1 my-2 text-sm text-white/90">{children}</ol>; },
        p({ children }) { return <p className="text-sm text-white/90 leading-relaxed my-1.5">{children}</p>; },
        strong({ children }) { return <strong className="font-bold text-white">{children}</strong>; },
        h1({ children }) { return <h1 className="text-lg font-bold text-white mt-4 mb-2">{children}</h1>; },
        h2({ children }) { return <h2 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h2>; },
        h3({ children }) { return <h3 className="text-sm font-bold text-white mt-2 mb-1">{children}</h3>; },
        blockquote({ children }) { return <blockquote className="border-l-2 border-primary/40 pl-3 italic text-on-surface-variant/80 my-2">{children}</blockquote>; },
        hr() { return <hr className="border-surface-border/40 my-3" />; },
      }}>{content}</ReactMarkdown>
    </div>
  );
}

function buildAPIMessages(msgList) {
  return msgList.map((m) => {
    if (m.role === "user") {
      const images = m.images || [];
      if (images.length === 0) {
        return { role: "user", content: m.content || "" };
      }
      const parts = [];
      for (const img of images) {
        parts.push({ type: "image_url", image_url: { url: img } });
      }
      parts.push({ type: "text", text: m.content || "" });
      return { role: "user", content: parts };
    }
    if (m.role === "assistant") {
      return { role: "assistant", content: m.content };
    }
    return m;
  });
}

let imgIdCounter = 0;

export default function ChatAIPage() {
  const t = useTranslate();
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "assistant", content: "Hi! I'm your AI creative assistant. Ask me to help craft video prompts, optimize scripts, or plan content strategies." },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [toast, setToast] = useState("");
  const [attachedImages, setAttachedImages] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1) {
          setMessages([
            { role: "system", content: SYSTEM_PROMPT },
            ...parsed,
          ]);
        }
      }
    } catch {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      try {
        const toSave = messages.filter(m => m.role !== "system");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {}
    }
  }, [messages, initialized]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  const regenerate = useCallback(async () => {
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const cut = messages.slice(0, idx);
    setMessages(cut);
    setStreamingContent("");
    await sendWithStream(cut);
  }, [messages]);

  const sendWithStream = async (msgList) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setStreamingContent("");

    const hasSystem = msgList.some(m => m.role === "system");
    const fullList = hasSystem ? msgList : [{ role: "system", content: SYSTEM_PROMPT }, ...msgList];

    try {
      const apiMessages = buildAPIMessages(fullList);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: model.value }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { full += delta; setStreamingContent(full); }
          } catch {}
        }
      }

      if (full) setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    } catch (err) {
      if (err.name === "AbortError") {
        if (streamingContent) setMessages((prev) => [...prev, { role: "assistant", content: streamingContent }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      }
    } finally {
      setLoading(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachedImages.length === 0) || loading) return;
    const userMsg = { role: "user", content: input.trim(), time: Date.now(), images: attachedImages.map(i => i.dataUrl) };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttachedImages([]);
    if (editingIdx !== -1) setEditingIdx(-1);
    await sendWithStream(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingIdx !== -1 ? saveEdit() : sendMessage(); }
    if (e.key === "Escape" && editingIdx !== -1) { setEditingIdx(-1); setInput(""); }
  };

  const copyMessage = (text) => { navigator.clipboard.writeText(text); showToast("Copied!"); };

  const startEditing = (idx) => {
    const msg = messages[idx];
    if (msg.role !== "user") return;
    setEditingIdx(idx);
    setInput(msg.content);
    inputRef.current?.focus();
  };

  const saveEdit = () => {
    if (!input.trim() || editingIdx === -1) return;
    const updated = messages.map((m, i) => i === editingIdx ? { ...m, content: input.trim(), time: Date.now() } : m);
    const cut = updated.slice(0, editingIdx);
    setMessages(cut);
    setInput("");
    setEditingIdx(-1);
    sendWithStream(cut);
  };

  const deleteMessage = (idx) => {
    setMessages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length < 2
        ? [{ role: "system", content: SYSTEM_PROMPT }, { role: "assistant", content: "Hi! I'm your AI creative assistant." }]
        : next;
    });
  };

  const clearConversation = () => {
    setMessages([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "assistant", content: "Hi! I'm your AI creative assistant. Ask me to help craft video prompts, optimize scripts, or plan content strategies." },
    ]);
    localStorage.removeItem(STORAGE_KEY);
    showToast("Conversation cleared");
  };

  const exportConversation = () => {
    const text = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "user" ? "You" : "AI"}: ${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported as text");
  };

  const addImages = useCallback((files) => {
    const newImages = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({ id: ++imgIdCounter, dataUrl: e.target.result, name: file.name });
        if (newImages.length === files.length) setAttachedImages((prev) => [...prev, ...newImages]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) files.push(item.getAsFile());
    }
    if (files.length > 0) { e.preventDefault(); addImages(files); }
  }, [addImages]);

  const removeAttached = (id) => setAttachedImages((prev) => prev.filter((img) => img.id !== id));

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const visibleMessages = messages.filter((m) => m.role !== "system");
  const isEditMode = editingIdx !== -1;

  return (
    <div className="h-screen overflow-hidden no-x-scroll">
      <SidebarProvider>
      <Sidebar />
      <TopBar />
      {toast && (
        <div className="fixed top-20 ltr:right-4 md:ltr:right-8 rtl:left-4 md:rtl:left-8 z-[999] px-4 py-2 bg-surface-container-high border border-surface-border/60 rounded-xl shadow-xl text-xs text-white animate-dropdown-open">
          {toast}
        </div>
      )}
      <main className="fixed top-14 md:top-16 ltr:right-0 rtl:left-0 w-full md:w-[calc(100%-16rem)] bottom-0 overflow-y-auto smooth-scroll">
        <div className="min-h-full flex flex-col">
          <div className="flex flex-col flex-1" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-surface-border/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>{t("Chat AI")}</h1>
                  <p className="text-[11px] text-on-surface-variant">Ask me anything about your content</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {visibleMessages.length > 1 && (
                  <>
                    <button onClick={exportConversation} className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-on-surface-variant/60 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                      <span className="material-symbols-outlined text-xs">download</span> Export
                    </button>
                    <button onClick={clearConversation} className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-on-surface-variant/60 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-lg">
                      <span className="material-symbols-outlined text-xs">delete_sweep</span> Clear
                    </button>
                  </>
                )}
                <div className="relative">
                  <button onClick={() => setShowModelPicker(!showModelPicker)} className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-low border border-surface-border/60 rounded-xl text-xs font-medium hover:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
                    {model.label}
                    <span className={`material-symbols-outlined text-[10px] text-on-surface-variant transition-transform ${showModelPicker ? "rotate-180" : ""}`}>expand_more</span>
                  </button>
                  {showModelPicker && (
                    <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2 w-60 bg-surface-container border border-surface-border/60 rounded-xl shadow-xl z-50 py-2">
                      {MODEL_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => { setModel(opt); setShowModelPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-high ${model.value === opt.value ? "text-primary bg-primary/5" : "text-on-surface"}`}>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-[10px] text-on-surface-variant/60 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-4">
              {visibleMessages.map((msg, i) => (
                <div key={i} className={`group flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary/20" : "bg-accent-cyan/20"}`}>
                    <span className={`material-symbols-outlined text-sm ${msg.role === "user" ? "text-primary" : "text-accent-cyan"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {msg.role === "user" ? "person" : "smart_toy"}
                    </span>
                  </div>
                  <div className={`max-w-[75%] relative ${msg.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-surface-container-low border border-surface-border/40"} rounded-2xl px-4 py-3`}>
                    {msg.images && msg.images.length > 0 && (
                      <div className={`flex flex-wrap gap-2 mb-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.images.map((img, j) => (
                          <img key={j} src={img} alt="attached" className="w-20 h-20 object-cover rounded-lg border border-surface-border/50" />
                        ))}
                      </div>
                    )}
                    {msg.role === "user" ? (
                      <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <Markdown content={msg.content} />
                    )}
                    <div className={`flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === "user" ? "justify-start flex-row-reverse" : "justify-end"}`}>
                      <button onClick={() => copyMessage(msg.content)} className="text-[10px] text-on-surface-variant/50 hover:text-primary transition-colors" title="Copy"><span className="material-symbols-outlined text-[10px]">content_copy</span></button>
                      {msg.role === "user" && (
                        <>
                          <button onClick={() => startEditing(i)} className="text-[10px] text-on-surface-variant/50 hover:text-primary transition-colors" title="Edit"><span className="material-symbols-outlined text-[10px]">edit</span></button>
                          <button onClick={() => deleteMessage(i)} className="text-[10px] text-on-surface-variant/50 hover:text-red-400 transition-colors" title="Delete"><span className="material-symbols-outlined text-[10px]">delete</span></button>
                        </>
                      )}
                      {msg.time && <span className="text-[9px] text-on-surface-variant/30">{formatTime(msg.time)}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm text-accent-cyan" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <div className="max-w-[75%] bg-surface-container-low border border-surface-border/40 rounded-2xl px-4 py-3">
                    <Markdown content={streamingContent} />
                  </div>
                </div>
              )}
              {loading && !streamingContent && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-sm text-accent-cyan" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span></div>
                  <div className="bg-surface-container-low border border-surface-border/40 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-6 lg:px-8 py-4 border-t border-surface-border/40">
              <div className="flex items-end gap-2 max-w-5xl mx-auto">
                <div className="flex-1">
                  {attachedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {attachedImages.map((img) => (
                        <div key={img.id} className="relative group/img w-16 h-16 rounded-lg overflow-hidden border border-surface-border/60">
                          <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeAttached(img.id)} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[8px] text-white">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-8 h-8 bg-surface-container-low border border-surface-border/60 rounded-lg flex items-center justify-center hover:border-primary/30 transition-all" title="Attach image">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant/80">image</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={isEditMode ? "Edit your message..." : attachedImages.length > 0 ? "Add a message about your images..." : "Ask me to help with your video prompts, scripts, or content..."}
                        rows={1}
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-xl pl-4 pr-12 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-on-surface-variant/40"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                      />
                      {isEditMode ? (
                        <button onClick={saveEdit} disabled={!input.trim()} className="absolute ltr:right-1.5 rtl:left-1.5 bottom-1.5 w-8 h-8 bg-accent-cyan/80 rounded-lg flex items-center justify-center transition-all active:scale-90 hover:bg-accent-cyan disabled:opacity-50">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </button>
                      ) : loading ? (
                        <button onClick={stopGeneration} className="absolute ltr:right-1.5 rtl:left-1.5 bottom-1.5 w-8 h-8 bg-red-500/80 rounded-lg flex items-center justify-center transition-all active:scale-90 hover:bg-red-500">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
                        </button>
                      ) : (
                        <button onClick={sendMessage} disabled={!input.trim() && attachedImages.length === 0} className="absolute ltr:right-1.5 rtl:left-1.5 bottom-1.5 w-8 h-8 primary-gradient rounded-lg flex items-center justify-center shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                {!loading && visibleMessages.length > 1 && (
                  <button onClick={regenerate} className="text-[10px] text-on-surface-variant/60 hover:text-primary transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">replay</span> Regenerate
                  </button>
                )}
                {isEditMode && (
                  <button onClick={() => { setEditingIdx(-1); setInput(""); }} className="text-[10px] text-on-surface-variant/60 hover:text-white transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">close</span> Cancel edit
                  </button>
                )}
              </div>
              <p className="text-[10px] text-on-surface-variant/50 text-center mt-2">Powered by OpenRouter — {model.label}</p>
            </div>
          </div>
        </div>
      </main>
      </SidebarProvider>
    </div>
  );
}
