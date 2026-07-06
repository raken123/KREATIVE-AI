import React, { useState } from "react";
import { KreativeItem, SubscriptionType, PageContent, PageSection, PageSectionItem } from "../types";
import { Sparkles, Layout, Download, Plus, Trash2, ArrowUp, ArrowDown, Check, Lock, Globe, Settings, Eye } from "lucide-react";

interface PageBuilderProps {
  item: KreativeItem;
  subscription: SubscriptionType;
  watermarkFreeLeft: number;
  onDecrementWatermarkFree: () => void;
  onSave: (updatedContent: PageContent) => void;
  onBack: () => void;
  onRedirectToPricing: () => void;
  onUseAi?: () => void;
  aiUsage?: number;
  aiLimit?: number;
}

export default function PageBuilder({
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
}: PageBuilderProps) {
  const content = item.content as PageContent;
  const [sections, setSections] = useState<PageSection[]>(content.sections || []);
  const [colorTheme, setColorTheme] = useState<"modern" | "dark" | "warm" | "brutalist">(content.colorTheme || "modern");
  const [pageTitle, setPageTitle] = useState(content.pageTitle || "Min Webbplats");
  const [metaDescription, setMetaDescription] = useState(content.metaDescription || "");
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  const showWatermark = subscription === "free" || (subscription === "office" && watermarkFreeLeft <= 0);

  // AI page builder state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const hasPremiumAccess = subscription === "office" || subscription === "organization";

  const updatePageState = (newSections: PageSection[], theme = colorTheme, title = pageTitle, desc = metaDescription) => {
    setSections(newSections);
    setColorTheme(theme);
    setPageTitle(title);
    setMetaDescription(desc);
    onSave({
      pageTitle: title,
      metaDescription: desc,
      colorTheme: theme,
      sections: newSections,
    });
  };

  const handleAddSection = (type: "hero" | "features" | "content" | "pricing" | "contact") => {
    const id = `sec-${Date.now()}`;
    let newSec: PageSection;

    switch (type) {
      case "hero":
        newSec = {
          id,
          type,
          title: "Din Stora Rubrik Här",
          subtitle: "En övertygande undertext som beskriver vad ni gör och erbjuder.",
          content: "Klicka Här",
        };
        break;
      case "features":
        newSec = {
          id,
          type,
          title: "Våra fantastiska funktioner",
          subtitle: "Varför välja oss framför konkurrenterna?",
          items: [
            { title: "Blixtsnabb", description: "Vår lösning är byggd för maximal prestanda." },
            { title: "Säker", description: "Dina data krypteras och förvaras säkert hos oss." },
            { title: "Användarvänlig", description: "Designad för enkelhet och finess." },
          ],
        };
        break;
      case "content":
        newSec = {
          id,
          type,
          title: "Vår vision och bakgrund",
          subtitle: "Lär känna historien bakom vår idé",
          content: "Det här är en längre styckesektion där du kan skriva en utförlig text om ert projekt, företag eller skola. Texten flödar elegant och ger besökaren djupare förståelse för ert budskap.",
        };
        break;
      case "pricing":
        newSec = {
          id,
          type,
          title: "Priser anpassade för alla",
          subtitle: "Hitta den licens som passar bäst",
          items: [
            { name: "Bas", price: "49 kr", features: ["1 användare", "Basal support", "Standard design"] },
            { name: "Pro", price: "149 kr", features: ["Oändliga användare", "24/7 support", "Premium design"] },
          ],
        };
        break;
      case "contact":
      default:
        newSec = {
          id,
          type,
          title: "Hör av dig till oss",
          subtitle: "Vi svarar oftast inom några timmar.",
          content: "Skicka e-post på kontakt@exempel.se eller ring oss på 08-123 45 67.",
        };
        break;
    }

    const updated = [...sections, newSec];
    updatePageState(updated);
    setActiveSectionIndex(updated.length - 1);
  };

  const handleDeleteSection = (idx: number) => {
    if (sections.length <= 1) return;
    const updated = sections.filter((_, sidx) => sidx !== idx);
    updatePageState(updated);
    setActiveSectionIndex(Math.max(0, idx - 1));
  };

  const handleMoveSection = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    updatePageState(updated);
    setActiveSectionIndex(targetIdx);
  };

  const handleFieldChange = (field: string, value: any) => {
    const updated = sections.map((sec, idx) => {
      if (idx === activeSectionIndex) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    updatePageState(updated);
  };

  const handleItemFieldChange = (itemIdx: number, field: string, value: any) => {
    const updated = sections.map((sec, idx) => {
      if (idx === activeSectionIndex) {
        const updatedItems = (sec.items || []).map((item, iidx) => {
          if (iidx === itemIdx) {
            return { ...item, [field]: value };
          }
          return item;
        });
        return { ...sec, items: updatedItems };
      }
      return sec;
    });
    updatePageState(updated);
  };

  const handleGenerateAiPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPremiumAccess) return;
    if (!aiPrompt.trim()) {
      setAiError("Vänligen beskriv webbsidan du vill skapa.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate-webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          colorTheme,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Misslyckades att generera webbsida.");
      }

      const data = await response.json();
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error("Svar från AI-servern saknade giltiga sektioner.");
      }

      const formattedSections: PageSection[] = data.sections.map((s: any, idx: number) => ({
        id: `ai-sec-${Date.now()}-${idx}`,
        type: s.type || "content",
        title: s.title || "AI Rubrik",
        subtitle: s.subtitle || "",
        content: s.content || "",
        items: s.items || [],
      }));

      updatePageState(formattedSections, colorTheme, data.pageTitle || pageTitle, data.metaDescription || metaDescription);
      setActiveSectionIndex(0);
      setAiPrompt("");
      if (onUseAi) onUseAi();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Ett oväntat fel uppstod vid genereringen.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate self-contained standalone production-ready HTML code
  const handleExportHtml = () => {
    const themeStyles = getThemeStyles();
    
    // Construct sections html
    let sectionsHtml = "";
    sections.forEach((sec) => {
      sectionsHtml += `<section class="py-16 md:py-24 px-6 md:px-12 border-b border-gray-100 last:border-0 ${sec.type === 'hero' ? themeStyles.bgClass + ' text-slate-900' : ''}">
        <div class="max-w-4xl mx-auto">
          ${sec.type === 'hero' ? `
            <div class="text-center py-8">
              <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">${sec.title}</h1>
              <p class="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">${sec.subtitle || ""}</p>
              ${sec.content ? `<button class="px-8 py-3.5 ${themeStyles.buttonClass} text-white font-semibold rounded-xl shadow-md cursor-pointer transition-all hover:scale-105">${sec.content}</button>` : ""}
            </div>
          ` : ""}

          ${sec.type === 'features' ? `
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold tracking-tight mb-4">${sec.title}</h2>
              <p class="text-gray-500 max-w-xl mx-auto">${sec.subtitle || ""}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              ${(sec.items || []).map(item => `
                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">${item.title || ""}</h3>
                  <p class="text-sm text-gray-500 leading-relaxed">${item.description || ""}</p>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${sec.type === 'content' ? `
            <div class="max-w-2xl mx-auto">
              <h2 class="text-3xl font-bold mb-4">${sec.title}</h2>
              <h4 class="text-gray-500 font-medium mb-6">${sec.subtitle || ""}</h4>
              <p class="text-gray-700 leading-relaxed text-base">${sec.content || ""}</p>
            </div>
          ` : ""}

          ${sec.type === 'pricing' ? `
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold tracking-tight mb-4">${sec.title}</h2>
              <p class="text-gray-500 max-w-xl mx-auto">${sec.subtitle || ""}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              ${(sec.items || []).map(item => `
                <div class="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${item.name || ""}</h3>
                    <div class="text-3xl font-extrabold text-gray-900 my-4">${item.price || "0 kr"}</div>
                    <ul class="space-y-2 mt-4 text-sm text-gray-600">
                      ${(item.features || []).map(f => `<li class="flex items-center gap-2">✓ ${f}</li>`).join("")}
                    </ul>
                  </div>
                  <button class="w-full mt-6 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-xs">Välj Plan</button>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${sec.type === 'contact' ? `
            <div class="max-w-md mx-auto text-center">
              <h2 class="text-3xl font-bold mb-4">${sec.title}</h2>
              <p class="text-gray-500 mb-6">${sec.subtitle || ""}</p>
              <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p class="text-gray-800 font-medium">${sec.content || ""}</p>
              </div>
            </div>
          ` : ""}
        </div>
      </section>`;
    });

    const watermarkFooterHtml = showWatermark ? `
  <div style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(239, 68, 68, 0.95); color: white; text-align: center; padding: 12px; font-weight: bold; z-index: 99999; font-family: sans-serif; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); font-size: 13px; backdrop-filter: blur(4px);">
    SKAPAD MED KREATIVE AI - VATTENSTÄMPEL AKTIV
  </div>` : "";

    const fullHtml = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    h1, h2, h3, h4 {
      font-family: 'Space Grotesk', sans-serif;
    }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 ${showWatermark ? 'pb-12' : ''}">
  <header class="py-5 px-8 bg-white border-b border-gray-100 flex items-center justify-between">
    <div class="font-bold text-lg tracking-tight text-gray-900">${pageTitle}</div>
    <div class="text-xs text-gray-400 font-mono">Skapad med KREATIVE</div>
  </header>

  <main>
    ${sectionsHtml}
  </main>

  <footer class="py-12 bg-gray-900 text-gray-400 text-center text-sm border-t border-gray-800">
    <p>&copy; ${new Date().getFullYear()} ${pageTitle}. Alla rättigheter förbehållna.</p>
    <p class="text-xs text-gray-600 mt-2">Drivs av KREATIVE Sidsystem</p>
  </footer>

  ${watermarkFooterHtml}
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.name.toLowerCase().replace(/\s+/g, "-") || "sida"}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (subscription === "office" && watermarkFreeLeft > 0) {
      onDecrementWatermarkFree();
    }
  };

  // Setup visual styling based on selected color theme
  const getThemeStyles = () => {
    switch (colorTheme) {
      case "dark":
        return {
          bgClass: "bg-slate-900 text-white",
          buttonClass: "bg-white text-slate-900 hover:bg-slate-100",
          accentText: "text-indigo-400",
          cardClass: "bg-slate-800 border-slate-700 text-white",
          label: "Slate Mörk",
        };
      case "warm":
        return {
          bgClass: "bg-amber-50/70 text-amber-950",
          buttonClass: "bg-amber-900 hover:bg-amber-950 text-white",
          accentText: "text-amber-700",
          cardClass: "bg-white border-amber-100 text-amber-950",
          label: "Varm Kräm",
        };
      case "brutalist":
        return {
          bgClass: "bg-white text-black border-4 border-black",
          buttonClass: "bg-black text-white hover:bg-slate-900 border-2 border-black font-mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          accentText: "text-black underline font-extrabold",
          cardClass: "bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black",
          label: "Brutalist B&W",
        };
      case "modern":
      default:
        return {
          bgClass: "bg-indigo-50/50 text-indigo-950",
          buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
          accentText: "text-indigo-600",
          cardClass: "bg-white border-slate-100 text-slate-800",
          label: "Modern Indigo",
        };
    }
  };

  const themeStyles = getThemeStyles();
  const activeSection = sections[activeSectionIndex];

  return (
    <div id="page-builder" className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              {item.name}
              <span className="text-xs font-normal text-slate-400 font-mono">WEBBPLATS</span>
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
            <p className="text-xs text-slate-500">Bygg en hel landningssida sektion för sektion. Sparas automatiskt.</p>
          </div>
        </div>

        {/* Action items */}
        <div className="flex items-center gap-3">
          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(["modern", "dark", "warm", "brutalist"] as const).map((t) => (
              <button
                key={t}
                id={`theme-${t}`}
                onClick={() => updatePageState(sections, t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  colorTheme === t ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "modern" ? "Indigo" : t === "dark" ? "Mörk" : t === "warm" ? "Varm" : "Brutal"}
              </button>
            ))}
          </div>

          <button
            id="export-html-btn"
            onClick={handleExportHtml}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-all"
          >
            <Download className="w-4 h-4" /> Ladda ner HTML-kod
          </button>

          <button
            id="page-back-dash"
            onClick={onBack}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer transition-all"
          >
            Stäng
          </button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side: Section manager & fields */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-5 border-b border-slate-100">
            <h4 className="font-display font-bold text-xs text-slate-400 tracking-wider uppercase mb-3">Sajt-detaljer</h4>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sidans titel</label>
                <input
                  type="text"
                  id="page-title"
                  value={pageTitle}
                  onChange={(e) => updatePageState(sections, colorTheme, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Beskrivning (SEO)</label>
                <textarea
                  id="page-desc"
                  value={metaDescription}
                  onChange={(e) => updatePageState(sections, colorTheme, pageTitle, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none min-h-[50px]"
                />
              </div>
            </div>
          </div>

          {/* Section Sorter List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h4 className="font-display font-bold text-xs text-slate-400 tracking-wider uppercase mb-1">Sektionsordning</h4>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => setActiveSectionIndex(idx)}
                  className={`group p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between relative ${
                    idx === activeSectionIndex
                      ? "border-indigo-600 bg-indigo-50/20"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                  }`}
                >
                  <div>
                    <span className="font-mono text-[9px] text-slate-400 font-semibold uppercase mr-1.5 bg-slate-200/50 px-1 py-0.5 rounded-sm">
                      {sec.type}
                    </span>
                    <span className="font-display font-bold text-xs text-slate-700 line-clamp-1">{sec.title || "Ny sektion"}</span>
                  </div>

                  {/* Section action buttons */}
                  <div className="hidden group-hover:flex items-center gap-1 bg-white border p-0.5 rounded-lg shadow-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, "up"); }}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, "down"); }}
                      disabled={idx === sections.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(idx); }}
                      disabled={sections.length <= 1}
                      className="p-0.5 text-red-400 hover:text-red-700 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick-add grid */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Lägg till ny sektion</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["hero", "features", "content", "pricing", "contact"] as const).map((stype) => (
                  <button
                    key={stype}
                    id={`add-sec-${stype}`}
                    onClick={() => handleAddSection(stype)}
                    className="py-1.5 px-2 border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 font-medium text-xs rounded-lg cursor-pointer transition-all text-left"
                  >
                    + {stype === "hero" ? "Intro (Hero)" : stype === "features" ? "Funktioner" : stype === "content" ? "Innehåll" : stype === "pricing" ? "Prislista" : "Kontakt"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center area: Active section editor & Live preview mock */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          {/* Active section detailed editing fields */}
          {activeSection ? (
            <div className="w-full md:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto shrink-0 flex flex-col gap-4">
              <h4 className="font-display font-bold text-xs text-indigo-600 tracking-wider uppercase">
                Redigera sektion ({activeSection.type})
              </h4>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Sektionsrubrik</label>
                <input
                  type="text"
                  id="section-title-input"
                  value={activeSection.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-display font-medium"
                />
              </div>

              {(activeSection.type === "hero" || activeSection.type === "features" || activeSection.type === "content" || activeSection.type === "pricing" || activeSection.type === "contact") && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Undertext / Slogan</label>
                  <textarea
                    id="section-subtitle-input"
                    value={activeSection.subtitle || ""}
                    onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden min-h-[50px] resize-none"
                  />
                </div>
              )}

              {(activeSection.type === "hero" || activeSection.type === "content" || activeSection.type === "contact") && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {activeSection.type === "hero" ? "Knapptext" : "Löpande Text / Detaljer"}
                  </label>
                  <textarea
                    id="section-content-input"
                    value={activeSection.content || ""}
                    onChange={(e) => handleFieldChange("content", e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden min-h-[100px]"
                  />
                </div>
              )}

              {/* Special rendering for Lists (features/pricing) */}
              {(activeSection.type === "features" || activeSection.type === "pricing") && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Lista med kort</label>
                  {(activeSection.items || []).map((item, itemIdx) => (
                    <div key={itemIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400">Kort #{itemIdx + 1}</div>
                      
                      {activeSection.type === "features" ? (
                        <>
                          <input
                            type="text"
                            placeholder="Titel"
                            id={`item-title-${itemIdx}`}
                            value={item.title || ""}
                            onChange={(e) => handleItemFieldChange(itemIdx, "title", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <textarea
                            placeholder="Beskrivning"
                            id={`item-desc-${itemIdx}`}
                            value={item.description || ""}
                            onChange={(e) => handleItemFieldChange(itemIdx, "description", e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs resize-none h-16"
                          />
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Paketnamn"
                            id={`item-name-${itemIdx}`}
                            value={item.name || ""}
                            onChange={(e) => handleItemFieldChange(itemIdx, "name", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Pris (t.ex. 99 kr)"
                            id={`item-price-${itemIdx}`}
                            value={item.price || ""}
                            onChange={(e) => handleItemFieldChange(itemIdx, "price", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-80 bg-white border-r border-slate-200 p-5 shrink-0 flex items-center justify-center">
              <p className="text-xs text-slate-400 italic">Välj en sektion för att redigera.</p>
            </div>
          )}

          {/* Right side: Elegant live mockup frame */}
          <div className="flex-1 p-8 overflow-y-auto flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs px-2">
              <Globe className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Lokal Webbläsarsimulator</span>
            </div>

            <div className="flex-1 w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              {/* Browser bar */}
              <div className="h-10 bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2 shrink-0 select-none">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-6 bg-white border border-slate-200 rounded-md text-[11px] text-slate-500 px-3 py-1 font-mono flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  https://kreative.local/{item.name.toLowerCase().replace(/\s+/g, "-")}
                </div>
              </div>

              {/* HTML Simulator View */}
              <div className="flex-1 overflow-y-auto bg-gray-50 text-slate-900 scroll-smooth relative">
                {showWatermark && (
                  <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center rotate-[-15deg] opacity-[0.05] z-50">
                    <div className="text-slate-800 font-extrabold text-5xl tracking-widest font-mono text-center leading-none">
                      KREATIVE AI<br />VATTENSTÄMPEL
                    </div>
                  </div>
                )}
                {/* Simulated header */}
                <header className="py-4 px-6 bg-white border-b border-gray-100 flex items-center justify-between select-none">
                  <div className="font-display font-bold text-sm tracking-tight text-slate-950">{pageTitle}</div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wider">
                    Mockup
                  </div>
                </header>

                {/* Simulated Sections */}
                <div className="space-y-0.5">
                  {sections.map((sec, sidx) => {
                    const isActive = sidx === activeSectionIndex;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => setActiveSectionIndex(sidx)}
                        className={`relative border-2 ${
                          isActive ? "border-indigo-600" : "border-transparent hover:border-slate-300"
                        } cursor-pointer transition-all`}
                      >
                        {isActive && (
                          <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md z-10 font-mono">
                            Aktiv sektion
                          </span>
                        )}

                        {sec.type === "hero" && (
                          <div className={`py-16 px-6 text-center ${themeStyles.bgClass}`}>
                            <h1 className="text-3.5xl font-display font-extrabold tracking-tight mb-4 leading-tight">
                              {sec.title}
                            </h1>
                            <p className="text-sm md:text-base max-w-xl mx-auto opacity-80 leading-relaxed mb-6">
                              {sec.subtitle}
                            </p>
                            {sec.content && (
                              <button className={`px-6 py-2.5 font-semibold text-xs rounded-xl shadow-xs ${themeStyles.buttonClass}`}>
                                {sec.content}
                              </button>
                            )}
                          </div>
                        )}

                        {sec.type === "features" && (
                          <div className={`py-12 px-6 bg-white text-slate-800`}>
                            <div className="text-center mb-8">
                              <h2 className="text-2xl font-display font-bold text-slate-900">{sec.title}</h2>
                              <p className="text-slate-500 text-xs mt-1">{sec.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto">
                              {(sec.items || []).map((item, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border border-slate-100 ${themeStyles.cardClass}`}>
                                  <h3 className="font-display font-bold text-sm text-slate-900 mb-1">{item.title}</h3>
                                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sec.type === "content" && (
                          <div className="py-12 px-6 bg-white">
                            <div className="max-w-md mx-auto">
                              <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">{sec.title}</h2>
                              <p className="text-indigo-600 text-xs font-semibold mb-4">{sec.subtitle}</p>
                              <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">{sec.content}</p>
                            </div>
                          </div>
                        )}

                        {sec.type === "pricing" && (
                          <div className="py-12 px-6 bg-slate-50">
                            <div className="text-center mb-8">
                              <h2 className="text-2xl font-display font-bold text-slate-900">{sec.title}</h2>
                              <p className="text-slate-500 text-xs mt-1">{sec.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                              {(sec.items || []).map((item, idx) => (
                                <div key={idx} className={`p-6 rounded-xl border border-slate-100 bg-white flex flex-col justify-between`}>
                                  <div>
                                    <h3 className="font-display font-bold text-sm text-slate-900">{item.name}</h3>
                                    <div className="text-2xl font-display font-extrabold text-slate-900 my-2">{item.price}</div>
                                    <ul className="text-slate-500 text-[11px] space-y-1">
                                      {(item.features || []).map((f, fidx) => (
                                        <li key={fidx}>✓ {f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <button className="w-full mt-4 py-1.5 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-medium">
                                    Välj plan
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sec.type === "contact" && (
                          <div className="py-12 px-6 bg-white text-center">
                            <div className="max-w-xs mx-auto">
                              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">{sec.title}</h2>
                              <p className="text-slate-500 text-xs mb-4">{sec.subtitle}</p>
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-slate-800 text-xs font-medium font-mono">{sec.content}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Simulated footer */}
                <footer className="py-8 bg-slate-900 text-slate-400 text-center text-xs select-none border-t border-slate-800">
                  <p>&copy; {new Date().getFullYear()} {pageTitle}. Mockup skapad med KREATIVE.</p>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: AI Generator Drawer */}
        <div className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-display font-bold text-slate-800 text-sm">AI-Skapa Sida</h4>
            </div>

            {!hasPremiumAccess ? (
              // Locked AI assistant for Free Users
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mt-2">
                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h5 className="font-display font-bold text-slate-800 text-xs mb-1">Office Pack krävs</h5>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Generera skräddarsydda landningssidor med text och full struktur automatiskt.
                </p>
                <button
                  id="lock-upgrade-page"
                  onClick={onRedirectToPricing}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all"
                >
                  Uppgradera nu
                </button>
              </div>
            ) : (
              // Active AI Page Generator Form
              <form onSubmit={handleGenerateAiPage} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Vad ska sidan handla om?</label>
                  <textarea
                    id="ai-page-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="T.ex. 'En modern hemsida för en yogastudio i Stockholm med priser och kontaktinformation'..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden min-h-[95px] resize-none"
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
                  id="submit-ai-page"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-xs rounded-xl cursor-pointer disabled:cursor-not-allowed shadow-xs transition-all"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin text-sm">✦</span> AI ritar sidan...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Skapa sida med AI
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4 text-[10px] text-slate-500 leading-relaxed">
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-400 tracking-wider uppercase">Färgteman</h5>
              <p>• <strong>Modern</strong>: Professionella och lugnande indigofärger.</p>
              <p>• <strong>Slate Mörk</strong>: Minimalistisk och behaglig nattlig layout.</p>
              <p>• <strong>Varm Kräm</strong>: Redaktionell mjuk känsla i bärnstens-toner.</p>
              <p>• <strong>Brutalist</strong>: Djärva svarta ramar och tung asymmetrisk text.</p>
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
