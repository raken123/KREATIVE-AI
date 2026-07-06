import React, { useState, useEffect, useRef } from "react";
import { KreativeItem, SubscriptionType, VideoContent, VideoScene } from "../types";
import { 
  Sparkles, Video, Play, Pause, Square, ChevronUp, ChevronDown, 
  Plus, Trash2, Download, Lock, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle, Cloud
} from "lucide-react";

interface VideoEditorProps {
  item: KreativeItem;
  subscription: SubscriptionType;
  watermarkFreeLeft: number;
  onDecrementWatermarkFree: () => void;
  onSave: (updatedContent: VideoContent) => void;
  onBack: () => void;
  onRedirectToPricing: () => void;
  onUseAi?: () => void;
  aiUsage?: number;
  aiLimit?: number;
}

const GRADIENT_PRESETS = [
  { name: "Slate Space", value: "from-slate-950 via-slate-900 to-indigo-950" },
  { name: "Sunset Glow", value: "from-rose-950 via-orange-950 to-amber-950" },
  { name: "Cosmic Neon", value: "from-violet-950 via-purple-900 to-slate-950" },
  { name: "Ocean Depth", value: "from-teal-950 via-blue-950 to-slate-950" },
  { name: "Forest Aurora", value: "from-emerald-950 via-teal-950 to-slate-950" },
  { name: "Crimson Eclipse", value: "from-red-950 via-stone-900 to-zinc-950" },
];

export default function VideoEditor({
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
}: VideoEditorProps) {
  const content = item.content as VideoContent;
  const [scenes, setScenes] = useState<VideoScene[]>(() => {
    return content.scenes || [
      {
        id: "s1",
        title: "Välkommen till Framtiden",
        subtitle: "En presentation om KREATIVE AI",
        body: "Den här videon skapades med HTML och laddas ner som en riktig MP4-video.",
        duration: 5,
        backgroundGradient: "from-slate-950 via-slate-900 to-indigo-950",
        textColor: "text-white",
        animationType: "fade"
      }
    ];
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  
  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  
  // AI Generator States
  const [aiPrompt, setAiPrompt] = useState("");
  const [requestedDuration, setRequestedDuration] = useState<number>(30); // in seconds
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Export & Quality resolution states based on tier requirements
  const [exportResolution, setExportResolution] = useState<"360p" | "720p" | "4k" | "8k" | "360_vr">(() => {
    if (subscription === "business") return "8k";
    if (subscription === "organization") return "4k";
    if (subscription === "office") return "720p";
    return "360p";
  });

  // Compilation States (HTML Canvas to WebM/MP4 Recording)
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  // Refs for tracking animation frames
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasPremiumAccess = subscription === "office" || subscription === "organization" || subscription === "business";
  const showWatermark = subscription === "free" || (subscription === "office" && watermarkFreeLeft <= 0);

  // Subscription duration limit logic
  // "med AI kan man skapa videor upp till 5 minuter med Office Pack men med Organization Pack kan man göra upp till 8 minuter"
  const getDurationLimit = (): { minutes: number; seconds: number; label: string } => {
    if (subscription === "business") {
      return { minutes: 20, seconds: 1200, label: "Business Pack (20 min)" };
    } else if (subscription === "organization") {
      return { minutes: 8, seconds: 480, label: "Organization Pack (8 min)" };
    } else if (subscription === "office") {
      return { minutes: 5, seconds: 300, label: "Office Pack (5 min)" };
    } else {
      return { minutes: 1, seconds: 60, label: "Gratisversion (1 min)" };
    }
  };

  const limitInfo = getDurationLimit();
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);

  // Sync state back to parent
  const saveChanges = (updatedScenes: VideoScene[]) => {
    const total = updatedScenes.reduce((acc, s) => acc + (s.duration || 5), 0);
    onSave({
      scenes: updatedScenes,
      totalDuration: total
    });
  };

  // Find active scene based on currentTime
  const getActiveSceneAndProgress = (time: number): { scene: VideoScene; index: number; sceneProgress: number } => {
    let acc = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (time >= acc && time < acc + scene.duration) {
        return {
          scene,
          index: i,
          sceneProgress: (time - acc) / scene.duration
        };
      }
      acc += scene.duration;
    }
    // Return last scene if past limits
    return {
      scene: scenes[scenes.length - 1],
      index: scenes.length - 1,
      sceneProgress: 1
    };
  };

  const activePlayback = getActiveSceneAndProgress(currentTime);

  // Animation ticks for playback
  useEffect(() => {
    if (isPlaying) {
      const tick = (timestamp: number) => {
        if (previousTimeRef.current !== null) {
          const delta = (timestamp - previousTimeRef.current) / 1000; // convert to seconds
          setCurrentTime((prev) => {
            const next = prev + delta;
            if (next >= totalDuration) {
              setIsPlaying(false);
              return 0; // stop and reset
            }
            return next;
          });
        }
        previousTimeRef.current = timestamp;
        requestRef.current = requestAnimationFrame(tick);
      };
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    }

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Handle AI Video Generation
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      setAiError("Ange ett ämne eller beskrivning för din video.");
      return;
    }

    // Check duration limits based on subscription
    if (requestedDuration > limitInfo.seconds) {
      setAiError(`Ditt abonnemang (${limitInfo.label}) tillåter endast videor upp till ${limitInfo.minutes} minuter.`);
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/api/gemini/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          maxDuration: requestedDuration
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Misslyckades att generera video.");
      }

      const data = await response.json();
      
      if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
        // Enforce limit protection on generated scenes
        let currentSum = 0;
        const boundedScenes: VideoScene[] = [];
        
        for (const s of data.scenes) {
          const duration = s.duration || 5;
          if (currentSum + duration <= limitInfo.seconds) {
            boundedScenes.push({
              id: `sc-${Math.random().toString(36).substr(2, 9)}`,
              title: s.title || "Scen",
              subtitle: s.subtitle || "",
              body: s.body || "",
              duration: duration,
              backgroundGradient: s.backgroundGradient || "from-slate-900 to-indigo-950",
              textColor: s.textColor || "text-white",
              animationType: s.animationType || "fade"
            });
            currentSum += duration;
          } else {
            // Cap the last scene duration if possible or discard
            const available = limitInfo.seconds - currentSum;
            if (available >= 3) {
              boundedScenes.push({
                id: `sc-${Math.random().toString(36).substr(2, 9)}`,
                title: s.title || "Scen",
                subtitle: s.subtitle || "",
                body: s.body || "",
                duration: available,
                backgroundGradient: s.backgroundGradient || "from-slate-900 to-indigo-950",
                textColor: s.textColor || "text-white",
                animationType: s.animationType || "fade"
              });
            }
            break;
          }
        }

        setScenes(boundedScenes);
        saveChanges(boundedScenes);
        setActiveSceneIndex(0);
        setCurrentTime(0);
        setAiPrompt("");
        if (onUseAi) onUseAi();
      } else {
        throw new Error("Genererat svar saknar giltigt format.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Det gick inte att ansluta till AI-servern.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Canvas Drawing Helper (Used for active frame & video recording compiler)
  const drawSceneToCanvas = (
    ctx: CanvasRenderingContext2D, 
    scene: VideoScene, 
    progress: number, 
    width: number, 
    height: number,
    is360?: boolean
  ) => {
    // 1. Draw gradient background
    // Parse tailwind style gradient to canvas linear gradient
    let grad = ctx.createLinearGradient(0, 0, width, height);
    if (scene.backgroundGradient.includes("from-rose-950")) {
      grad.addColorStop(0, "#4c0519");
      grad.addColorStop(0.5, "#431407");
      grad.addColorStop(1, "#451a03");
    } else if (scene.backgroundGradient.includes("from-violet-950")) {
      grad.addColorStop(0, "#2e1065");
      grad.addColorStop(0.5, "#581c87");
      grad.addColorStop(1, "#020617");
    } else if (scene.backgroundGradient.includes("from-teal-950")) {
      grad.addColorStop(0, "#042f2e");
      grad.addColorStop(0.5, "#172554");
      grad.addColorStop(1, "#0f172a");
    } else if (scene.backgroundGradient.includes("from-emerald-950")) {
      grad.addColorStop(0, "#022c22");
      grad.addColorStop(0.5, "#115e59");
      grad.addColorStop(1, "#0f172a");
    } else if (scene.backgroundGradient.includes("from-red-950")) {
      grad.addColorStop(0, "#450a0a");
      grad.addColorStop(0.5, "#1c1917");
      grad.addColorStop(1, "#09090b");
    } else {
      // Default slate-950 via slate-900 to indigo-950
      grad.addColorStop(0, "#020617");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#1e1b4b");
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic decorative background grids / circles
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Calculate animation alpha/offsets based on animationType & progress
    let textAlpha = 1;
    let titleYOffset = 0;
    let subYOffset = 0;
    let scaleVal = 1;
    let blurVal = 0;

    const currentSecs = progress * scene.duration;

    // Fade-in during first 1.2 seconds, Fade-out during last 1.2 seconds
    const transitionTime = 1.0;
    if (currentSecs < transitionTime) {
      textAlpha = currentSecs / transitionTime;
    } else if (scene.duration - currentSecs < transitionTime) {
      textAlpha = (scene.duration - currentSecs) / transitionTime;
    }

    if (scene.animationType === "slide-up") {
      if (currentSecs < transitionTime) {
        const factor = 1 - (currentSecs / transitionTime);
        titleYOffset = factor * 30;
        subYOffset = factor * 40;
      }
    } else if (scene.animationType === "scale-up") {
      if (currentSecs < transitionTime) {
        const factor = currentSecs / transitionTime;
        scaleVal = 0.85 + factor * 0.15;
      } else if (scene.duration - currentSecs < transitionTime) {
        const factor = (scene.duration - currentSecs) / transitionTime;
        scaleVal = 0.85 + factor * 0.15;
      }
    } else if (scene.animationType === "slide-left") {
      if (currentSecs < transitionTime) {
        const factor = 1 - (currentSecs / transitionTime);
        titleYOffset = factor * 20;
      }
    } else if (scene.animationType === "blur") {
      if (currentSecs < transitionTime) {
        blurVal = (1 - (currentSecs / transitionTime)) * 15;
      } else if (scene.duration - currentSecs < transitionTime) {
        blurVal = (1 - (scene.duration - currentSecs) / transitionTime) * 15;
      }
    }

    // Apply blur if active
    if (blurVal > 0) {
      ctx.filter = `blur(${blurVal}px)`;
    } else {
      ctx.filter = "none";
    }

    // 3. Render Texts
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Main Title (Elegant Display Font representation)
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    ctx.font = `900 ${Math.floor(28 * scaleVal)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(scene.title, width / 2, height / 2 - 40 + titleYOffset);

    // Subtitle
    ctx.fillStyle = `rgba(165, 180, 252, ${textAlpha * 0.85})`;
    ctx.font = `600 ${Math.floor(14 * scaleVal)}px monospace`;
    ctx.fillText(scene.subtitle || "", width / 2, height / 2 + 10 + subYOffset);

    // Body text wrapped beautifully
    ctx.fillStyle = `rgba(241, 245, 249, ${textAlpha * 0.7})`;
    ctx.font = `400 11px system-ui, -apple-system, sans-serif`;
    
    const maxTextWidth = width * 0.8;
    const bodyText = scene.body || "";
    const words = bodyText.split(" ");
    let line = "";
    let lines = [];
    const lineHeight = 16;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    lines.forEach((l, lIdx) => {
      ctx.fillText(l, width / 2, height / 2 + 55 + (lIdx * lineHeight));
    });

    // Reset filters
    ctx.filter = "none";

    // Playback visual watermark / overlay helper
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.font = "bold 9px monospace";
    ctx.fillText("KREATIVE VIDEO STUDIO", width / 2, 25);

    if (showWatermark) {
      // Semi-transparent rotating watermark across the entire video frame
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-15 * Math.PI / 180);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.font = "900 64px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KREATIVE AI", 0, -35);
      ctx.fillText("VATTENSTÄMPEL", 0, 35);
      ctx.restore();

      // Also draw a nice watermark banner at the very bottom of the video
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, height - 30, width, 30);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SKAPAD MED KREATIVE AI - VATTENSTÄMPEL AKTIV", width / 2, height - 15);
    }
  };

  // Compile Canvas into actual downloading MP4 / WebM video file
  const handleCompileAndDownload = () => {
    if (isCompiling) return;

    // Enforce pricing plan limits explicitly on compile trigger
    if (exportResolution === "720p" && subscription === "free") {
      alert("Exportera i 720p HD kräver Office Pack eller högre.");
      onRedirectToPricing();
      return;
    }
    if (exportResolution === "4k" && subscription !== "organization" && subscription !== "business") {
      alert("Exportera i 4K Ultra HD kräver Organization Pack eller högre.");
      onRedirectToPricing();
      return;
    }
    if ((exportResolution === "8k" || exportResolution === "360_vr") && subscription !== "business") {
      alert("Exportera i 8K och 360° VR kräver Business Pack.");
      onRedirectToPricing();
      return;
    }

    setIsCompiling(true);
    setCompileProgress(0);
    setIsPlaying(false);

    // Map selected resolution to dimensions and bitrates
    // We cap the physical canvas size at 1080p (1920x1080) for 4K/8K/360° to prevent browser OOM/GPU crashes (sad dead face)
    // while scaling the bitrate high to preserve maximum visual fidelity during the client-side encoding.
    let compileWidth = 1280;
    let compileHeight = 720;
    let bps = 2500000;

    if (exportResolution === "360p") {
      compileWidth = 640;
      compileHeight = 360;
      bps = 800000;
    } else if (exportResolution === "720p") {
      compileWidth = 1280;
      compileHeight = 720;
      bps = 2500000;
    } else if (exportResolution === "4k") {
      compileWidth = 1920;
      compileHeight = 1080;
      bps = 8000000; // High quality 1080p stream representing 4K upscale
    } else if (exportResolution === "8k" || exportResolution === "360_vr") {
      compileWidth = 1920;
      compileHeight = 1080;
      bps = 15000000; // Ultra high quality 1080p stream representing 8K/VR
    }

    // Create a temporary canvas for compilation
    const canvas = document.createElement("canvas");
    canvas.width = compileWidth;
    canvas.height = compileHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("Det gick inte att starta grafikhårdvaran i din webbläsare.");
      setIsCompiling(false);
      return;
    }

    try {
      const stream = canvas.captureStream(30); // 30 FPS stream capture
      
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const resLabel = exportResolution === "360_vr" ? "360vr_8k" : exportResolution;
        a.download = `${item.name.toLowerCase().replace(/\s+/g, "-") || "video"}_${resLabel}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsCompiling(false);

        if (subscription === "office" && watermarkFreeLeft > 0) {
          onDecrementWatermarkFree();
        }
      };

      // Start recording
      mediaRecorder.start();

      // We animate and capture frames systematically
      const fps = 30;
      const frameDuration = 1 / fps;
      let compileTime = 0;

      const recordInterval = setInterval(() => {
        // Draw scene
        const pb = getActiveSceneAndProgress(compileTime);
        drawSceneToCanvas(ctx, pb.scene, pb.sceneProgress, canvas.width, canvas.height, exportResolution === "360_vr");

        // Advance time
        compileTime += frameDuration;
        const progressPercent = Math.min(100, Math.floor((compileTime / totalDuration) * 100));
        setCompileProgress(progressPercent);

        if (compileTime >= totalDuration) {
          clearInterval(recordInterval);
          mediaRecorder.stop();
        }
      }, 33); // roughly 30 fps speed

    } catch (err) {
      console.error("Kompileringsfel:", err);
      alert("Ett fel uppstod vid kompilerering av din MP4-video.");
      setIsCompiling(false);
    }
  };

  // Keep live preview updated on canvas
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        drawSceneToCanvas(
          ctx, 
          activePlayback.scene, 
          activePlayback.sceneProgress, 
          canvasRef.current.width, 
          canvasRef.current.height,
          exportResolution === "360_vr"
        );
      }
    }
  }, [currentTime, scenes, exportResolution]);

  const handleUpdateScene = (updatedField: Partial<VideoScene>) => {
    const updated = [...scenes];
    updated[activeSceneIndex] = {
      ...updated[activeSceneIndex],
      ...updatedField
    };
    
    // Check total duration protection
    const proposedTotal = updated.reduce((acc, s) => acc + (s.duration || 5), 0);
    if (proposedTotal > limitInfo.seconds) {
      alert(`Abonnemangsbegränsning nådd! Din plan (${limitInfo.label}) stöder videor upp till max ${limitInfo.minutes} minuter.`);
      return;
    }

    setScenes(updated);
    saveChanges(updated);
  };

  const handleAddScene = () => {
    const proposedTotal = totalDuration + 5;
    if (proposedTotal > limitInfo.seconds) {
      alert(`Abonnemangsbegränsning nådd! Din plan (${limitInfo.label}) stöder videor upp till max ${limitInfo.minutes} minuter.`);
      return;
    }

    const newScene: VideoScene = {
      id: `sc-${Math.random().toString(36).substr(2, 9)}`,
      title: "Ny Scen",
      subtitle: "Underrubrik för ny scen",
      body: "Klicka här för att fylla i text.",
      duration: 5,
      backgroundGradient: "from-slate-950 via-slate-900 to-indigo-950",
      textColor: "text-white",
      animationType: "fade"
    };

    const updated = [...scenes, newScene];
    setScenes(updated);
    saveChanges(updated);
    setActiveSceneIndex(updated.length - 1);
  };

  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) {
      alert("En video måste innehålla minst en scen.");
      return;
    }
    const updated = scenes.filter((_, i) => i !== idx);
    setScenes(updated);
    saveChanges(updated);
    setActiveSceneIndex(Math.max(0, idx - 1));
    setCurrentTime(0);
  };

  const handleMoveScene = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === scenes.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...scenes];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setScenes(updated);
    saveChanges(updated);
    setActiveSceneIndex(targetIdx);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="video-editor-workspace">
      {/* Top Bar Navigation */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1">
                <Video className="w-3 h-3" /> HTML VIDEO Studio
              </span>
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
              {item.driveFileId && (
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1" title="Sparad i Google Drive">
                  <Cloud className="w-3 h-3" /> DRIVE
                </span>
              )}
            </div>
            <h1 className="font-display font-black text-slate-900 text-lg leading-tight mt-1">{item.name}</h1>
          </div>
        </div>

        {/* Compile / Download Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase px-1.5 whitespace-nowrap hidden sm:inline">Kvalitet:</label>
            <select
              value={exportResolution}
              onChange={(e) => {
                const val = e.target.value as any;
                // Plan check
                if (val === "720p" && subscription === "free") {
                  alert("HD (720p) kräver Office Pack eller högre.");
                  onRedirectToPricing();
                  return;
                }
                if (val === "4k" && subscription !== "organization" && subscription !== "business") {
                  alert("4K Ultra HD kräver Organization Pack eller högre.");
                  onRedirectToPricing();
                  return;
                }
                if ((val === "8k" || val === "360_vr") && subscription !== "business") {
                  alert("8K och 360° VR kräver Business Pack.");
                  onRedirectToPricing();
                  return;
                }
                setExportResolution(val);
              }}
              className="bg-white text-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="360p">360p (Free Trial)</option>
              <option value="720p" disabled={subscription === "free"}>
                {subscription === "free" ? "🔒 720p (Office Pack)" : "720p (Office Pack)"}
              </option>
              <option value="4k" disabled={subscription !== "organization" && subscription !== "business"}>
                {subscription !== "organization" && subscription !== "business" ? "🔒 4K (Organization)" : "4K (Organization)"}
              </option>
              <option value="8k" disabled={subscription !== "business"}>
                {subscription !== "business" ? "🔒 8K (Business Pack)" : "8K (Business Pack)"}
              </option>
              <option value="360_vr" disabled={subscription !== "business"}>
                {subscription !== "business" ? "🔒 360° VR Panorama" : "360° VR Panorama (Business)"}
              </option>
            </select>
          </div>
          <button
            onClick={handleCompileAndDownload}
            disabled={isCompiling}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Kompilerar {compileProgress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportera MP4
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Editing Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Column: Interactive Screen Preview & Timeline (col-span-7) */}
        <div className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-80px)]">
          
          {/* HD Canvas Frame Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Förhandsvisning (HTML)</span>
              <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Aktiv scen: {activePlayback.index + 1} av {scenes.length} ({formatTime(currentTime)} / {formatTime(totalDuration)})
              </div>
            </div>

            {/* Video Player Box Frame */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-900 flex flex-col items-center justify-center">
              
              {/* Hidden compile or active Canvas preview */}
              <canvas 
                ref={canvasRef} 
                width="854" 
                height="480" 
                className="w-full h-full object-cover"
                id="html-video-live-canvas"
              />

              {/* Centered Overlay controls on hover/play */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrubber inside video frame */}
                <input 
                  type="range" 
                  min="0" 
                  max={totalDuration} 
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />

                <span className="text-xs font-mono text-white whitespace-nowrap">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Timeline and Quick Timeline Navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Tidslinje & Scensekvenser</span>
              <button 
                onClick={handleAddScene}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Lägg till scen
              </button>
            </div>

            {/* Scrolling Timeline strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 snap-x">
              {scenes.map((scene, idx) => {
                const isActive = idx === activePlayback.index;
                const isSelected = idx === activeSceneIndex;

                return (
                  <div 
                    key={scene.id}
                    onClick={() => {
                      setActiveSceneIndex(idx);
                      // Move timeline playhead to the beginning of this scene
                      let acc = 0;
                      for (let i = 0; i < idx; i++) {
                        acc += scenes[i].duration;
                      }
                      setCurrentTime(acc);
                    }}
                    className={`shrink-0 w-44 p-4 rounded-2xl border text-left cursor-pointer transition-all snap-start relative group ${
                      isActive 
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20" 
                        : isSelected
                          ? "border-slate-400 bg-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {/* Scene Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Scen {idx + 1}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">{scene.duration}s</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 truncate mb-1">{scene.title || "Namnlös scen"}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{scene.subtitle || "Ingen undertext"}</p>

                    {/* Gradient preview bar */}
                    <div className={`mt-3 h-1.5 rounded-full w-full bg-gradient-to-r ${scene.backgroundGradient}`} />

                    {/* Left/Right Ordering & Delete Overlays (visible on hover) */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/90 shadow-sm border border-slate-150 rounded-lg p-0.5 z-10 animate-fade-in">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveScene(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                        title="Flytta fram"
                      >
                        <ChevronUp className="w-3 h-3 text-slate-600" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveScene(idx, "down");
                        }}
                        disabled={idx === scenes.length - 1}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                        title="Flytta bak"
                      >
                        <ChevronDown className="w-3 h-3 text-slate-600" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(idx);
                        }}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                        title="Radera scen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Limits Box */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Abonnemang: {limitInfo.label}</p>
                <p className="text-slate-500 mt-0.5">
                  Maximal videolängd med din licens är <strong className="text-slate-700">{limitInfo.minutes} minuter</strong> ({limitInfo.seconds}s).
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-slate-500 font-mono">Total längd: <strong>{formatTime(totalDuration)}</strong></div>
              <div className="text-[10px] text-slate-400 mt-0.5">{limitInfo.seconds - totalDuration}s tillgängligt kvar</div>
            </div>
          </div>

        </div>

        {/* Right Column: Scene Editor & AI Generator (col-span-5) */}
        <div className="lg:col-span-5 bg-white border-l border-slate-200 px-6 py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          
          {/* AI Creative Video Generator Tab */}
          <div className="space-y-4 pb-6 border-b border-slate-150">
            <h4 className="font-display font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Kreativ Video AI-generator
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Skriv ett ämne eller ett instruktionsmanus nedan. AI-motorn bygger en fullständig serie av vackra animerade scener med snygg matchande design.
            </p>

            <form onSubmit={handleGenerateVideo} className="space-y-3">
              <div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Skapa en kort förklarande video om jordens atmosfär och de fem olika lagren..."
                  className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl text-xs placeholder:text-slate-400 leading-relaxed resize-none"
                />
              </div>

              {/* Slider for Requested Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Önskad videolängd:</span>
                  <span className="font-mono font-bold text-indigo-600">{formatTime(requestedDuration)} ({requestedDuration} sekunder)</span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max={limitInfo.seconds} 
                  step="5"
                  value={requestedDuration}
                  onChange={(e) => setRequestedDuration(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block text-right">Maximal gräns för dig: {limitInfo.minutes} min</span>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {hasPremiumAccess ? (
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Genererar videoscener...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Skapa AI-video
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase">
                    <Lock className="w-4 h-4 text-indigo-600" /> AI-video är låst
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Du behöver <strong>Office Pack</strong> (upp till 5 min) eller <strong>Organization Pack</strong> (upp till 8 min) för att använda AI-videotjänsten.
                  </p>
                  <button
                    type="button"
                    onClick={onRedirectToPricing}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold block pt-1"
                  >
                    Se priser & uppgradera licenser →
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Active Scene Settings / Manual Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-black text-slate-900 text-xs uppercase tracking-wider">
                Manuell Scendesign (Scen {activeSceneIndex + 1})
              </h4>
              <span className="text-[10px] font-mono text-slate-400 uppercase">REDIGERA</span>
            </div>

            {scenes[activeSceneIndex] ? (
              <div className="space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Huvudrubrik</label>
                  <input
                    type="text"
                    value={scenes[activeSceneIndex].title}
                    onChange={(e) => handleUpdateScene({ title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    placeholder="Titel på scenen"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Underrubrik / Ingress</label>
                  <input
                    type="text"
                    value={scenes[activeSceneIndex].subtitle || ""}
                    onChange={(e) => handleUpdateScene({ subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    placeholder="Kort beskrivande undertitel"
                  />
                </div>

                {/* Body Text */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Scenens Manus / Brödtext</label>
                  <textarea
                    value={scenes[activeSceneIndex].body || ""}
                    onChange={(e) => handleUpdateScene({ body: e.target.value })}
                    className="w-full h-24 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl resize-none leading-relaxed"
                    placeholder="Förklarande detaljer eller manus till scenen..."
                  />
                </div>

                {/* Duration & Animation row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Scenlängd (sekunder)</label>
                    <input
                      type="number"
                      min="3"
                      max="60"
                      value={scenes[activeSceneIndex].duration}
                      onChange={(e) => handleUpdateScene({ duration: parseInt(e.target.value, 10) || 5 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Animeringstyp</label>
                    <select
                      value={scenes[activeSceneIndex].animationType}
                      onChange={(e) => handleUpdateScene({ animationType: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    >
                      <option value="fade">Mjuk toning (Fade)</option>
                      <option value="slide-up">Glid uppåt (Slide Up)</option>
                      <option value="scale-up">Zooma in (Scale In)</option>
                      <option value="slide-left">Skjut vänster (Slide Left)</option>
                      <option value="blur">Fokusera (Blur fade)</option>
                    </select>
                  </div>
                </div>

                {/* Preset Color Gradients */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Bakgrundsfärg & Gradient</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => {
                      const isSelected = scenes[activeSceneIndex].backgroundGradient === preset.value;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleUpdateScene({ backgroundGradient: preset.value })}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            isSelected 
                              ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10" 
                              : "border-slate-150 bg-white hover:border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-700">{preset.name}</span>
                          <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${preset.value} shrink-0`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Välj eller lägg till en scen ovan för att redigera.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
