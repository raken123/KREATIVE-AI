import React, { useState } from "react";
import { KreativeItem, SubscriptionType, DocumentContent } from "../types";
import { Sparkles, FileText, Download, Play, Check, Eye, Code, Lock, HelpCircle } from "lucide-react";

interface DocumentEditorProps {
  item: KreativeItem;
  subscription: SubscriptionType;
  watermarkFreeLeft: number;
  onDecrementWatermarkFree: () => void;
  onSave: (updatedContent: DocumentContent) => void;
  onBack: () => void;
  onRedirectToPricing: () => void;
  onUseAi?: () => void;
  aiUsage?: number;
  aiLimit?: number;
}

export default function DocumentEditor({
  item,
  subscription,
  watermarkFreeLeft,
  onDecrementWatermarkFree,
  onSave,
  onBack,
  onRedirectToPricing,
  onUseAi,
  aiUsage = 142,
  aiLimit = 500,
}: DocumentEditorProps) {
  const content = item.content as DocumentContent;
  const [markdown, setMarkdown] = useState(content.markdown || "");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  
  const showWatermark = subscription === "free" || (subscription === "office" && watermarkFreeLeft <= 0);
  
  // AI assistant state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiType, setAiType] = useState<"draft" | "improve" | "summarize">("improve");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Check if current user subscription allows AI usage
  const hasPremiumAccess = subscription === "office" || subscription === "organization";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMarkdown(val);
    onSave({ markdown: val });
  };

  const handleExport = () => {
    const element = document.createElement("a");
    const exportText = showWatermark 
      ? `${markdown}\n\n---\n*Skapad med Kreative AI - Vattenstämpel aktiv*` 
      : markdown;
    const file = new Blob([exportText], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.name.toLowerCase().replace(/\s+/g, "-") || "dokument"}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (subscription === "office" && watermarkFreeLeft > 0) {
      onDecrementWatermarkFree();
    }
  };

  const handleAiAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPremiumAccess) return;
    if (!aiPrompt.trim() && aiType === "improve") {
      setAiError("Vänligen skriv vad du vill förbättra.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: aiType,
          currentText: markdown,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Misslyckades att generera innehåll.");
      }

      const data = await response.json();
      
      if (aiType === "draft") {
        setMarkdown(data.text);
        onSave({ markdown: data.text });
      } else {
        // Appends or replaces selection, let's append/insert at cursor or append below
        const updated = markdown + "\n\n### AI Genererat Tillägg:\n" + data.text;
        setMarkdown(updated);
        onSave({ markdown: updated });
      }
      setAiPrompt("");
      if (onUseAi) onUseAi();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Ett oväntat fel uppstod vid kommunikation med AI-servern.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Simple custom Markdown parser for high fidelity rendering
  const parseMarkdown = (md: string) => {
    if (!md) return <p className="text-slate-400 italic">Inget innehåll ännu. Skriv något till vänster!</p>;
    
    const lines = md.split("\n");
    let inList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      // Headers
      if (line.startsWith("# ")) {
        elements.push(<h1 key={idx} className="text-3xl font-display font-bold text-slate-900 mt-6 mb-3 border-b pb-2 border-slate-100">{line.substring(2)}</h1>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-2xl font-display font-semibold text-slate-800 mt-5 mb-2">{line.substring(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-xl font-display font-medium text-slate-800 mt-4 mb-2">{line.substring(4)}</h3>);
      }
      // Horizontal Rule
      else if (line.trim() === "---") {
        elements.push(<hr key={idx} className="my-6 border-slate-200" />);
      }
      // Table support
      else if (line.startsWith("|")) {
        // Simple table visual render
        const cells = line.split("|").map(c => c.trim()).filter(c => c !== "");
        const isHeaderSeparator = line.includes("---") || line.includes(":---");
        if (isHeaderSeparator) return;
        elements.push(
          <div key={idx} className="overflow-x-auto my-2">
            <table className="min-w-full border border-slate-100 text-sm">
              <tbody>
                <tr className="bg-slate-50">
                  {cells.map((cell, cidx) => (
                    <td key={cidx} className="border px-3 py-2 font-medium text-slate-700">{cell}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      // Bullet list items
      else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        const contentStr = line.substring(2);
        elements.push(
          <ul key={idx} className="list-disc list-inside ml-4 space-y-1 my-1">
            <li className="text-slate-700 leading-relaxed">{contentStr}</li>
          </ul>
        );
      }
      // Empty line
      else if (line.trim() === "") {
        elements.push(<div key={idx} className="h-2"></div>);
      }
      // Standard paragraph
      else {
        // Handle bolding within paragraph **text**
        let renderedText: React.ReactNode = line;
        if (line.includes("**")) {
          const parts = line.split("**");
          renderedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part);
        }
        elements.push(<p key={idx} className="text-slate-700 leading-relaxed my-2 text-sm md:text-base">{renderedText}</p>);
      }
    });

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div id="document-editor" className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              {item.name}
              <span className="text-xs font-normal text-slate-400 font-mono">DOKUMENT</span>
              {subscription === "free" && (
                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">
                  Vattenstämpel Aktiv (Free Trial)
                </span>
              )}
              {subscription === "office" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${watermarkFreeLeft > 0 ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                  {watermarkFreeLeft > 0 ? `${watermarkFreeLeft} gratis utan vattenstämpel kvar` : "Vattenstämpel Aktiv (Kvot full)"}
                </span>
              )}
              {subscription === "organization" && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                  Licensierad ✓ (Ingen vattenstämpel)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">Skriv i Markdown på svenska. Spara sker automatiskt.</p>
          </div>
        </div>

        {/* View toggles & Action buttons */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="view-edit-only"
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${viewMode === "edit" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Code className="w-3.5 h-3.5" /> Skriv
            </button>
            <button
              id="view-split"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${viewMode === "split" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Eye className="w-3.5 h-3.5" /> Split
            </button>
            <button
              id="view-preview-only"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${viewMode === "preview" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              <FileText className="w-3.5 h-3.5" /> Förhandsgranska
            </button>
          </div>

          <button
            id="export-doc-btn"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs"
          >
            <Download className="w-4 h-4" /> Ladda ner .md
          </button>
          
          <button
            id="back-to-dash"
            onClick={onBack}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer transition-all"
          >
            Stäng
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Textarea editor */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
            <textarea
              id="doc-textarea"
              value={markdown}
              onChange={handleTextChange}
              className="flex-1 p-6 font-mono text-sm leading-relaxed text-slate-800 resize-none outline-hidden focus:ring-0 placeholder:text-slate-400"
              placeholder="# Mitt nya dokument&#10;&#10;Skriv din text i Markdown här..."
            />
          </div>
        )}

        {/* Right pane: Markdown parser/renderer preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 bg-slate-50 overflow-y-auto p-8 prose max-w-none relative">
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-xs rounded-xl p-8 min-h-[500px] relative overflow-hidden">
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center rotate-[-15deg] opacity-[0.05] z-50">
                  <div className="text-slate-800 font-extrabold text-5xl tracking-widest font-mono text-center leading-none">
                    KREATIVE AI<br />VATTENSTÄMPEL
                  </div>
                </div>
              )}
              {parseMarkdown(markdown)}
            </div>
          </div>
        )}

        {/* Floating/Sticky AI panel to the right */}
        <div className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-display font-bold text-slate-800 text-sm">AI-Skribent Co-Creator</h4>
            </div>

            {!hasPremiumAccess ? (
              // Locked AI assistant for Free Users
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mt-2">
                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h5 className="font-display font-bold text-slate-800 text-xs mb-1">Office Pack krävs</h5>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Lås upp obegränsad tillgång till AI-generering och smarta skrivfunktioner.
                </p>
                <button
                  id="lock-upgrade-button"
                  onClick={onRedirectToPricing}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs"
                >
                  Uppgradera nu
                </button>
              </div>
            ) : (
              // Active AI Assistant for Premium/Office/Org Users
              <form onSubmit={handleAiAction} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Genereringstyp</label>
                  <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-1 rounded-xl">
                    <button
                      type="button"
                      id="ai-type-improve"
                      onClick={() => setAiType("improve")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer text-left transition-all ${aiType === "improve" ? "bg-white text-indigo-600 shadow-xs border border-indigo-100" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Förbättra / Redigera text
                    </button>
                    <button
                      type="button"
                      id="ai-type-draft"
                      onClick={() => setAiType("draft")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer text-left transition-all ${aiType === "draft" ? "bg-white text-indigo-600 shadow-xs border border-indigo-100" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Skapa nytt utkast (Ersätt)
                    </button>
                    <button
                      type="button"
                      id="ai-type-summarize"
                      onClick={() => setAiType("summarize")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer text-left transition-all ${aiType === "summarize" ? "bg-white text-indigo-600 shadow-xs border border-indigo-100" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Sammanfatta texten (Lägg till)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Instruktion till AI</label>
                  <textarea
                    id="ai-instruction"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={
                      aiType === "draft"
                        ? "Skriv om vad du vill att utkastet ska handla om..."
                        : aiType === "improve"
                        ? "Skriv hur du vill förbättra (t.ex. 'gör mer formell', 'lägg till punktlista med fördelar')..."
                        : "Skriv eventuella specifika krav för sammanfattningen..."
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden min-h-[90px] resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {aiError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 leading-relaxed">
                    ⚠ {aiError}
                  </p>
                )}

                <button
                  type="submit"
                  id="submit-ai-doc"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-xs rounded-xl cursor-pointer disabled:cursor-not-allowed shadow-xs transition-all"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin text-sm">✦</span> AI arbetar...
                    </span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Verkställ AI-magi
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
            <div>
              <h5 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">Markdown-tips</h5>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                <div><code># Rubrik 1</code></div>
                <div><code>## Rubrik 2</code></div>
                <div><code>**Fetstilt**</code></div>
                <div><code>- Punktlista</code></div>
                <div><code>| Tabell |</code></div>
                <div><code>--- Avdelare</code></div>
              </div>
            </div>

            {/* Visual AI Limit Tracker inside Editor */}
            {hasPremiumAccess && (
              <div className="border-t border-slate-100 pt-3 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between font-medium text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> AI-Gräns
                  </span>
                  <span>{subscription === "organization" ? "Oändlig (Skola)" : `${aiUsage} / ${aiLimit}`}</span>
                </div>
                {subscription === "office" && (
                  <>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (aiUsage / aiLimit) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-400 block font-mono text-right">{aiLimit - aiUsage} förfrågningar kvar</span>
                  </>
                )}
                {subscription === "organization" && (
                  <span className="text-[9px] text-emerald-600 font-bold block">✓ Full licenserad tillgång utan gränser</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
