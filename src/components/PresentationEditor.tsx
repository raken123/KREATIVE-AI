import React, { useState } from "react";
import { KreativeItem, SubscriptionType, PresentationContent, Slide } from "../types";
import { Sparkles, Play, Plus, Trash2, ArrowUp, ArrowDown, LayoutGrid, Monitor, Check, Lock, ChevronLeft, ChevronRight } from "lucide-react";

interface PresentationEditorProps {
  item: KreativeItem;
  subscription: SubscriptionType;
  watermarkFreeLeft: number;
  onDecrementWatermarkFree: () => void;
  onSave: (updatedContent: PresentationContent) => void;
  onBack: () => void;
  onRedirectToPricing: () => void;
  onUseAi?: () => void;
  aiUsage?: number;
  aiLimit?: number;
}

export default function PresentationEditor({
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
}: PresentationEditorProps) {
  const content = item.content as PresentationContent;
  const [slides, setSlides] = useState<Slide[]>(content.slides || []);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);

  const showWatermark = subscription === "free" || (subscription === "office" && watermarkFreeLeft <= 0);

  // AI presentation creator state
  const [aiTopic, setAiTopic] = useState("");
  const [aiSlideCount, setAiSlideCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const hasPremiumAccess = subscription === "office" || subscription === "organization";

  const activeSlide = slides[activeSlideIndex];

  const updateSlidesState = (newSlides: Slide[]) => {
    setSlides(newSlides);
    onSave({ slides: newSlides });
  };

  const handleFieldChange = (field: "title" | "body" | "layout", value: string) => {
    if (!activeSlide) return;
    const updated = slides.map((s, idx) => {
      if (idx === activeSlideIndex) {
        return { ...s, [field]: value };
      }
      return s;
    });
    updateSlidesState(updated);
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: "Ny Slide Rubrik",
      body: "Skriv punktlistor eller brödtext här...",
      layout: "bullets",
    };
    const updated = [...slides, newSlide];
    updateSlidesState(updated);
    setActiveSlideIndex(updated.length - 1);
  };

  const handleDeleteSlide = (idxToDelete: number) => {
    if (slides.length <= 1) return; // Prevent deleting the last slide
    const updated = slides.filter((_, idx) => idx !== idxToDelete);
    updateSlidesState(updated);
    setActiveSlideIndex(Math.max(0, idxToDelete - 1));
  };

  const handleMoveSlide = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slides.length - 1) return;
    
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...slides];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    updateSlidesState(updated);
    setActiveSlideIndex(targetIdx);
  };

  const handleGenerateAiSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPremiumAccess) return;
    if (!aiTopic.trim()) {
      setAiError("Vänligen skriv ett ämne för presentationen.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          slideCount: aiSlideCount,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Misslyckades att generera presentation.");
      }

      const data = await response.json();
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error("Svar från AI-servern saknade slides-data.");
      }

      const formattedSlides: Slide[] = data.slides.map((s: any, idx: number) => ({
        id: `ai-slide-${Date.now()}-${idx}`,
        title: s.title || "Ny Slide",
        body: s.body || "",
        layout: s.layout || "bullets",
      }));

      updateSlidesState(formattedSlides);
      setActiveSlideIndex(0);
      setAiTopic("");
      if (onUseAi) onUseAi();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Ett oväntat fel uppstod.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard navigation for play mode
  React.useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        setPlayerIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setPlayerIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Escape") {
        setIsPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, slides.length]);

  const startPresentation = () => {
    setPlayerIndex(0);
    setIsPlaying(true);
    if (subscription === "office" && watermarkFreeLeft > 0) {
      onDecrementWatermarkFree();
    }
  };

  // Renders the slide style based on layout type
  const renderSlideContent = (slide: Slide, scaleClass = "text-base") => {
    if (!slide) return null;

    const bodyParagraphs = slide.body.split("\n").filter(Boolean);

    switch (slide.layout) {
      case "hero":
        return (
          <div className="flex flex-col items-center justify-center text-center h-full p-8 bg-linear-to-br from-slate-900 to-indigo-950 text-white rounded-xl select-none">
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4 drop-shadow-sm animate-fade-in">
              {slide.title}
            </h1>
            <div className="w-16 h-1 bg-indigo-500 rounded-full mb-6"></div>
            <p className="text-slate-300 max-w-xl text-lg md:text-xl leading-relaxed">
              {slide.body}
            </p>
          </div>
        );

      case "center":
        return (
          <div className="flex flex-col items-center justify-center text-center h-full p-10 bg-slate-50 border border-slate-100 rounded-xl select-none">
            <div className="text-slate-300 text-6xl font-serif mb-2">“</div>
            <h2 className="text-2xl md:text-3.5xl font-display font-semibold italic text-slate-800 leading-relaxed max-w-2xl">
              {slide.title}
            </h2>
            <div className="text-slate-300 text-6xl font-serif leading-none mt-2">”</div>
            <p className="text-slate-500 font-mono text-xs tracking-wider uppercase mt-6">
              {slide.body}
            </p>
          </div>
        );

      case "split":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 h-full rounded-xl overflow-hidden border border-slate-100 bg-white">
            <div className="p-8 bg-indigo-600 text-white flex flex-col justify-center">
              <h2 className="text-2.5xl md:text-4xl font-display font-bold mb-4 leading-tight">
                {slide.title}
              </h2>
              <div className="w-10 h-1 bg-white/30 rounded-full"></div>
            </div>
            <div className="p-8 bg-slate-50 flex flex-col justify-center space-y-3">
              {bodyParagraphs.map((p, i) => (
                <p key={i} className="text-slate-700 leading-relaxed text-sm md:text-base">
                  {p}
                </p>
              ))}
            </div>
          </div>
        );

      case "bullets":
      default:
        return (
          <div className="flex flex-col h-full p-8 md:p-10 bg-white border border-slate-100 rounded-xl justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-indigo-950 tracking-tight mb-6">
                {slide.title}
              </h2>
              <ul className="space-y-4">
                {bodyParagraphs.map((p, i) => {
                  const cleanedText = p.replace(/^-\s*|^•\s*|^[*]\s*/, "");
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">{cleanedText}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {item.name}
            </div>
          </div>
        );
    }
  };

  return (
    <div id="presentation-editor" className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Play Mode overlay screen */}
      {isPlaying && (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-6 md:p-10">
          {/* Play Header */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-tight text-indigo-400">KREATIVE PRESENTATION</span>
              <span className="text-slate-500 font-mono text-xs">|</span>
              <span className="text-slate-300 font-medium text-sm">{item.name}</span>
            </div>
            <button
              id="exit-play"
              onClick={() => setIsPlaying(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 hover:text-white text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all border border-white/5"
            >
              Avsluta presentation (Esc)
            </button>
          </div>

          {/* Active slide inside viewport */}
          <div className="flex-1 max-w-4xl w-full mx-auto my-6 flex items-center justify-center">
            <div className="w-full aspect-16/9 max-h-[75vh] shadow-2xl relative overflow-hidden">
              {showWatermark && (
                <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center rotate-[-15deg] opacity-[0.06] z-50">
                  <div className="text-white font-extrabold text-6xl tracking-widest font-mono text-center leading-none">
                    KREATIVE AI<br />VATTENSTÄMPEL
                  </div>
                </div>
              )}
              {renderSlideContent(slides[playerIndex], "text-lg")}
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center justify-between text-white border-t border-white/10 pt-4 max-w-lg w-full mx-auto">
            <button
              id="play-prev-btn"
              disabled={playerIndex === 0}
              onClick={() => setPlayerIndex(p => Math.max(0, p - 1))}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-sm text-slate-400">
              Slide {playerIndex + 1} av {slides.length}
            </span>
            <button
              id="play-next-btn"
              disabled={playerIndex === slides.length - 1}
              onClick={() => setPlayerIndex(p => Math.min(slides.length - 1, p + 1))}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-full cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Standard Editor Top Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 flex items-center gap-2">
              {item.name}
              <span className="text-xs font-normal text-slate-400 font-mono">PRESENTATION</span>
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
            <p className="text-xs text-slate-500">Hantera slides, ändra layout och visa live. Sparas automatiskt.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="start-slides-btn"
            onClick={startPresentation}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-white" /> Starta Presentation
          </button>
          
          <button
            id="pres-back-dash"
            onClick={onBack}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer transition-all"
          >
            Stäng
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Slides list sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-display font-bold text-xs text-slate-500 tracking-wide uppercase">Slides ({slides.length})</h4>
            <button
              id="add-slide-sidebar"
              onClick={handleAddSlide}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all"
              title="Lägg till slide"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Slides List Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIndex(idx)}
                className={`group p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between relative ${
                  idx === activeSlideIndex
                    ? "border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/5"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">{idx + 1}</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                    {slide.layout}
                  </span>
                </div>
                <h5 className="font-display font-bold text-xs text-slate-800 line-clamp-1 pr-4">{slide.title || "Namnlös Slide"}</h5>
                
                {/* Rearrange slide buttons */}
                <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white border border-slate-100 p-0.5 rounded-lg shadow-sm">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, "up"); }}
                    disabled={idx === 0}
                    className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, "down"); }}
                    disabled={idx === slides.length - 1}
                    className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSlide(idx); }}
                    disabled={slides.length <= 1}
                    className="p-0.5 text-red-400 hover:text-red-700 disabled:opacity-30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              id="add-slide-bottom"
              onClick={handleAddSlide}
              className="w-full py-2 px-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 font-medium text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Lägg till ny Slide
            </button>
          </div>
        </div>

        {/* Center: Slide Live Editing & Preview */}
        {activeSlide ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
            {/* Editor panel (left side in center area) */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto shrink-0 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Slide Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "hero", label: "Hero Intro" },
                    { id: "bullets", label: "Punktlista" },
                    { id: "split", label: "Split Sida" },
                    { id: "center", label: "Citat / Center" },
                  ].map((lay) => (
                    <button
                      key={lay.id}
                      id={`layout-${lay.id}`}
                      onClick={() => handleFieldChange("layout", lay.id)}
                      className={`py-2 px-3 border rounded-xl text-xs font-medium cursor-pointer text-center transition-all ${
                        activeSlide.layout === lay.id
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-700"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {lay.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Slide Rubrik</label>
                <input
                  type="text"
                  id="slide-title-input"
                  value={activeSlide.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Skriv rubrik..."
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Innehåll / Brödtext</label>
                <p className="text-[10px] text-slate-400">För punktlista, påbörja rader med nya stycken eller bindestreck.</p>
                <textarea
                  id="slide-body-input"
                  value={activeSlide.body}
                  onChange={(e) => handleFieldChange("body", e.target.value)}
                  className="flex-1 w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-hidden resize-none min-h-[150px]"
                  placeholder="Skriv innehåll här..."
                />
              </div>
            </div>

            {/* Live mockup slide viewport */}
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
              <div className="w-full max-w-2xl aspect-16/9 bg-white shadow-lg border border-slate-200 rounded-2xl overflow-hidden p-2 relative">
                <div className="w-full h-full border border-dashed border-slate-200 rounded-xl overflow-hidden relative">
                  {showWatermark && (
                    <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center rotate-[-15deg] opacity-[0.05] z-50">
                      <div className="text-slate-800 font-extrabold text-4xl tracking-widest font-mono text-center leading-none">
                        KREATIVE AI<br />VATTENSTÄMPEL
                      </div>
                    </div>
                  )}
                  {renderSlideContent(activeSlide)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-100">
            <LayoutGrid className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
            <p className="text-slate-500 text-sm">Välj en slide i sidopanelen eller lägg till en ny.</p>
          </div>
        )}

        {/* Right column: AI Creation Drawer */}
        <div className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-display font-bold text-slate-800 text-sm">AI-Skapa Presentation</h4>
            </div>

            {!hasPremiumAccess ? (
              // Locked AI assistant for Free Users
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mt-2">
                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h5 className="font-display font-bold text-slate-800 text-xs mb-1">Office Pack krävs</h5>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Generera kompletta, pedagogiska presentationer på sekunder med vår AI Co-Creator.
                </p>
                <button
                  id="lock-upgrade-pres-btn"
                  onClick={onRedirectToPricing}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs"
                >
                  Uppgradera nu
                </button>
              </div>
            ) : (
              // Active AI Presentation Generator
              <form onSubmit={handleGenerateAiSlides} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Presentationsämne</label>
                  <textarea
                    id="ai-topic-input"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Skriv ett ämne (t.ex. 'Hur solpaneler fungerar', 'Kreativt skrivande för mellanstadiet')..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden min-h-[90px] resize-none"
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 tracking-wide uppercase">Antal Slides ({aiSlideCount} st)</label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={aiSlideCount}
                    onChange={(e) => setAiSlideCount(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                    disabled={isGenerating}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>2 slides</span>
                    <span>6 slides</span>
                  </div>
                </div>

                {aiError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 leading-relaxed">
                    ⚠ {aiError}
                  </p>
                )}

                <button
                  type="submit"
                  id="submit-ai-slides"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-xs rounded-xl cursor-pointer disabled:cursor-not-allowed shadow-xs transition-all"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin text-sm">✦</span> AI genererar slides...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Skriv & Skapa med AI
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
            <div>
              <h5 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">Slide-guider</h5>
              <div className="space-y-1.5 text-[10px] text-slate-500 leading-relaxed">
                <p>• <strong>Hero</strong> passar bäst för förstasidan.</p>
                <p>• <strong>Split</strong> stöder jämförelse av två textblock.</p>
                <p>• <strong>Bullets</strong> visar punkter och struktur.</p>
                <p>• <strong>Center</strong> sätter fokus på ett enstaka citat.</p>
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
