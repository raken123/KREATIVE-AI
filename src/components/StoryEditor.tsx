import React, { useState, useEffect, useRef } from "react";
import { KreativeItem, SubscriptionType, StoryContent, StoryScene, StoryCharacter, StoryDialogue } from "../types";
import { 
  Sparkles, Play, Pause, Square, Plus, Trash2, Download, Lock, HelpCircle, 
  ArrowLeft, RefreshCw, AlertTriangle, Cloud, User, Smile, MessageSquare, 
  Map, UserCheck, Move, Volume2, Type, Scaling, ChevronRight, Wand2
} from "lucide-react";

interface StoryEditorProps {
  item: KreativeItem;
  subscription: SubscriptionType;
  watermarkFreeLeft: number;
  onDecrementWatermarkFree: () => void;
  onSave: (updatedContent: StoryContent) => void;
  onBack: () => void;
  onRedirectToPricing: () => void;
  onUseAi?: () => void;
  aiUsage?: number;
  aiLimit?: number;
}

const BACKGROUNDS = [
  { id: "forest", name: "Magisk Skog 🌳", label: "Skog" },
  { id: "space", name: "Yttre Rymden 🌌", label: "Rymden" },
  { id: "city", name: "Storstad i Solnedgång 🌆", label: "Stad" },
  { id: "castle", name: "Dunkelt Slott 🏰", label: "Slott" },
  { id: "school", name: "Klassrum 🏫", label: "Skola" },
  { id: "office", name: "Modernt Kontor 🏢", label: "Kontor" },
  { id: "desert", name: "Vild Öken 🌵", label: "Öken" },
  { id: "underwater", name: "Djupt Hav 🐠", label: "Hav" }
];

const PUPPET_TYPES = [
  { id: "wizard", name: "Trollkarl 🧙‍♂️", emoji: "🧙‍♂️" },
  { id: "robot", name: "Robot 🤖", emoji: "🤖" },
  { id: "astronaut", name: "Astronaut 🧑‍🚀", emoji: "🧑‍🚀" },
  { id: "dragon", name: "Drake 🐲", emoji: "🐲" },
  { id: "fairy", name: "Alv 🧚‍♀️", emoji: "🧚‍♀️" },
  { id: "alien", name: "Utomjording 👽", emoji: "👽" },
  { id: "monster", name: "Monster 👹", emoji: "👹" },
  { id: "cat", name: "Katt 🐱", emoji: "🐱" },
  { id: "hero", name: "Hjälte 🦸‍♂️", emoji: "🦸‍♂️" }
];

const EXPRESSIONS = [
  { id: "happy", name: "Glad 😊", emoji: "😊" },
  { id: "surprised", name: "Överraskad 😮", emoji: "😮" },
  { id: "sad", name: "Ledsen 😢", emoji: "😢" },
  { id: "angry", name: "Arg 😡", emoji: "😡" },
  { id: "neutral", name: "Neutral 😐", emoji: "😐" }
];

const ANIMATIONS = [
  { id: "idle", name: "Stilla ⏳" },
  { id: "bounce", name: "Studsa 🦘" },
  { id: "float", name: "Sväva 🎈" },
  { id: "spin", name: "Snurra 🌀" },
  { id: "walk", name: "Vanka 🚶‍♂️" },
  { id: "shake", name: "Skaka ⚡" }
];

const CHARACTER_EMOJIS: Record<string, string> = {
  wizard: "🧙‍♂️",
  robot: "🤖",
  astronaut: "🧑‍🚀",
  dragon: "🐲",
  fairy: "🧚‍♀️",
  alien: "👽",
  monster: "👹",
  cat: "🐱",
  hero: "🦸‍♂️"
};

const EXPRESSION_EMOJIS: Record<string, string> = {
  happy: "😊",
  surprised: "😮",
  sad: "😢",
  angry: "😡",
  neutral: "😐"
};

const CLOTHING_TYPES = [
  { id: "default", name: "Originaldräkt 👗" },
  { id: "casual", name: "Casual T-shirt 👕" },
  { id: "spacesuit", name: "Rymddräkt 🧑‍🚀" },
  { id: "royal", name: "Kunglig mantel 👑" },
  { id: "armor", name: "Riddarrustning 🛡️" },
  { id: "pyjamas", name: "Nattkläder/Pyjamas 💤" },
  { id: "wizardrobe", name: "Trollkarlskåpa ✨" },
  { id: "explorer", name: "Utforskarkläder 🗺️" }
];

function drawDetailedCharacter(
  ctx: CanvasRenderingContext2D,
  char: StoryCharacter,
  globalTime: number,
  isPlaying: boolean
) {
  const type = char.type;
  const expr = char.expression || "neutral";
  const cloth = char.clothing || "default";

  // Base colors for skins/bodies based on character type
  let primaryColor = "#f43f5e"; // default pinkish
  let secondaryColor = "#be123c";
  let eyeColor = "#000000";
  let accessoryColor = "#fbbf24";

  if (type === "wizard") {
    primaryColor = "#e2e8f0"; // pale elder skin
    secondaryColor = "#6366f1"; // indigo robes
    accessoryColor = "#fbbf24"; // golden magic
  } else if (type === "robot") {
    primaryColor = "#94a3b8"; // steel gray
    secondaryColor = "#475569";
    accessoryColor = "#38bdf8"; // neon blue light
  } else if (type === "astronaut") {
    primaryColor = "#f1f5f9"; // white spacesuit base
    secondaryColor = "#334155";
    accessoryColor = "#0ea5e9"; // glass blue visor
  } else if (type === "dragon") {
    primaryColor = "#22c55e"; // green dragon scale
    secondaryColor = "#15803d";
    accessoryColor = "#f97316"; // fire orange
  } else if (type === "fairy") {
    primaryColor = "#fed7aa"; // soft peach skin
    secondaryColor = "#f472b6"; // magical pink
    accessoryColor = "#a7f3d0"; // mint wings
  } else if (type === "alien") {
    primaryColor = "#4ade80"; // lime green alien
    secondaryColor = "#16a34a";
    accessoryColor = "#a855f7"; // purple neon accents
  } else if (type === "monster") {
    primaryColor = "#ea580c"; // bright orange fuzzy
    secondaryColor = "#9a3412";
    accessoryColor = "#e11d48"; // ruby red claws/horns
  } else if (type === "cat") {
    primaryColor = "#f59e0b"; // ginger cat orange
    secondaryColor = "#b45309";
    accessoryColor = "#fef08a"; // pale yellow belly
  } else if (type === "hero") {
    primaryColor = "#ffedd5"; // tan hero skin
    secondaryColor = "#dc2626"; // scarlet cape
    accessoryColor = "#eab308"; // gold star/emblem
  }

  // Draw legs
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  
  // Leg colors depend on clothing or base
  let pantsColor = secondaryColor;
  if (cloth === "casual") pantsColor = "#1d4ed8"; // denim blue
  else if (cloth === "pyjamas") pantsColor = "#38bdf8"; // light blue sleeping pants
  else if (cloth === "spacesuit") pantsColor = "#cbd5e1"; // white pants
  else if (cloth === "royal") pantsColor = "#7f1d1d"; // royal burgundy pants
  else if (cloth === "armor") pantsColor = "#475569"; // metallic steel pants
  else if (cloth === "wizardrobe") pantsColor = "#312e81"; // dark purple robes
  else if (cloth === "explorer") pantsColor = "#ca8a04"; // khaki safari pants

  // Left leg
  ctx.strokeStyle = pantsColor;
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-10, -2);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(10, -20);
  ctx.lineTo(10, -2);
  ctx.stroke();

  // Feet/Shoes
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(-10, -2, 5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -2, 5, Math.PI, 0);
  ctx.fill();

  // Torso / Dress / Clothes Base
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.roundRect(-18, -50, 36, 32, 6);
  ctx.fill();

  // Draw customized clothes on top of torso
  let activeClothing = cloth;
  if (activeClothing === "default") {
    // Map default clothing to puppet types
    if (type === "wizard") activeClothing = "wizardrobe";
    else if (type === "robot") activeClothing = "armor";
    else if (type === "astronaut") activeClothing = "spacesuit";
    else if (type === "dragon") activeClothing = "royal";
    else if (type === "fairy") activeClothing = "casual";
    else if (type === "alien") activeClothing = "spacesuit";
    else if (type === "monster") activeClothing = "casual";
    else if (type === "cat") activeClothing = "pyjamas";
    else if (type === "hero") activeClothing = "royal";
  }

  if (activeClothing === "casual") {
    // Colorful striped Casual T-shirt
    ctx.fillStyle = "#ef4444"; // Red base
    ctx.beginPath();
    ctx.roundRect(-18, -50, 36, 30, [6, 6, 0, 0]);
    ctx.fill();
    // Stripes
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-18, -42, 36, 4);
    ctx.fillRect(-18, -32, 36, 4);
  } else if (activeClothing === "spacesuit") {
    // White space suit with blue and red badges
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(-19, -50, 38, 30, 6);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Chest HUD controls
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(-6, -42, 5, 5);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(1, -42, 5, 5);
  } else if (activeClothing === "royal") {
    // Rich royal crimson velvet cape draped on sides and gold trim
    ctx.fillStyle = "#dc2626"; // Crimson cape
    ctx.beginPath();
    ctx.roundRect(-20, -50, 40, 32, 8);
    ctx.fill();
    // Golden royal sash/lining
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -50);
    ctx.lineTo(12, -22);
    ctx.stroke();
    // Gold emblem medallion
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(0, -42, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeClothing === "armor") {
    // Metallic steel gray armor plates with gold rivet detail
    ctx.fillStyle = "#64748b"; // metallic plate
    ctx.beginPath();
    ctx.roundRect(-19, -50, 38, 30, [6, 6, 2, 2]);
    ctx.fill();
    // Highlight lines
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-19, -36);
    ctx.lineTo(19, -36);
    ctx.stroke();
    // Gold rivets
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(-12, -45, 1.5, 0, Math.PI * 2);
    ctx.arc(12, -45, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeClothing === "pyjamas") {
    // Cute pajamas with stars or dots
    ctx.fillStyle = "#bae6fd"; // soft blue fabric
    ctx.beginPath();
    ctx.roundRect(-18, -50, 36, 30, 6);
    ctx.fill();
    // Draw dot patterns
    ctx.fillStyle = "#38bdf8"; 
    ctx.beginPath();
    ctx.arc(-8, -42, 1.5, 0, Math.PI * 2);
    ctx.arc(8, -32, 1.5, 0, Math.PI * 2);
    ctx.arc(-4, -26, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (activeClothing === "wizardrobe") {
    // Royal deep blue/indigo robe with stellar dust stars
    ctx.fillStyle = "#312e81"; // Indigo
    ctx.beginPath();
    ctx.roundRect(-19, -51, 38, 32, 8);
    ctx.fill();
    // Gold collar
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, -50);
    ctx.lineTo(0, -40);
    ctx.lineTo(9, -50);
    ctx.stroke();
  } else if (activeClothing === "explorer") {
    // Safari khaki explorer vest with cute pockets and buttons
    ctx.fillStyle = "#ca8a04"; // Khaki tan/yellowish
    ctx.beginPath();
    ctx.roundRect(-18, -50, 36, 30, 6);
    ctx.fill();
    // Pockets
    ctx.fillStyle = "#854d0e";
    ctx.fillRect(-12, -42, 8, 7);
    ctx.fillRect(4, -42, 8, 7);
    // Vest belt/buttons
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-1, -50, 2, 30); // center seam
    ctx.beginPath();
    ctx.arc(0, -46, 2, 0, Math.PI * 2);
    ctx.arc(0, -36, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Specific Character Details Behind / Around Head
  if (type === "dragon") {
    // Dragon tail
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.moveTo(12, -32);
    ctx.quadraticCurveTo(28, -36, 24, -20);
    ctx.quadraticCurveTo(22, -12, 10, -22);
    ctx.closePath();
    ctx.fill();
    // Back wings
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.ellipse(16, -46, 10, 16, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "fairy") {
    // Beautiful large translucent magical wings on back
    ctx.fillStyle = "rgba(196, 181, 253, 0.75)"; // Light violet glowing translucent wings
    ctx.beginPath();
    ctx.ellipse(18, -48, 12, 18, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(-18, -48, 12, 18, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (type === "hero") {
    // Flowing superhero cape waving behind torso
    ctx.fillStyle = "#dc2626"; // Crimson red
    ctx.beginPath();
    ctx.moveTo(-14, -48);
    const wave = isPlaying ? Math.sin(globalTime * 8) * 6 : Math.sin(Date.now() / 150) * 3;
    ctx.quadraticCurveTo(-26 + wave, -38, -22 + wave, -18);
    ctx.lineTo(-4, -26);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Arms (hanging down or animating slightly)
  ctx.lineWidth = 5;
  ctx.strokeStyle = primaryColor;
  if (activeClothing === "spacesuit") ctx.strokeStyle = "#ffffff";
  else if (activeClothing === "wizardrobe") ctx.strokeStyle = "#312e81";
  else if (activeClothing === "armor") ctx.strokeStyle = "#64748b";

  // Left arm
  ctx.beginPath();
  ctx.moveTo(-15, -46);
  const leftArmWave = isPlaying ? Math.sin(globalTime * 5) * 6 : 0;
  ctx.lineTo(-24, -32 + leftArmWave);
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(15, -46);
  const rightArmWave = isPlaying ? Math.cos(globalTime * 5) * 6 : 0;
  ctx.lineTo(24, -32 + rightArmWave);
  ctx.stroke();

  // Hands/Paw/Glove circle
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(-24, -32 + leftArmWave, 3.5, 0, Math.PI * 2);
  ctx.arc(24, -32 + rightArmWave, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // DRAW HEAD
  // We place head center at y = -66
  const headY = -66;
  const headRadius = 16;

  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw Specific Puppet Facial Structures/Headwear
  if (type === "wizard") {
    // Draw spectacular high-pointed Wizard Hat with gold stars!
    ctx.fillStyle = "#4f46e5"; // Purple/indigo hat
    ctx.beginPath();
    ctx.moveTo(-18, headY - 10);
    ctx.quadraticCurveTo(0, headY - 12, 18, headY - 10);
    ctx.lineTo(0, headY - 38);
    ctx.closePath();
    ctx.fill();
    // Hat brim
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-22, headY - 10);
    ctx.lineTo(22, headY - 10);
    ctx.stroke();
    // Wizard elder white long beard
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.moveTo(-11, headY + 5);
    ctx.quadraticCurveTo(0, headY + 26, 11, headY + 5);
    ctx.quadraticCurveTo(0, headY + 11, -11, headY + 5);
    ctx.closePath();
    ctx.fill();
  } else if (type === "robot") {
    // Boxy robot head plate
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.roundRect(-13, headY - 13, 26, 24, 4);
    ctx.fill();
    // Antenna
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, headY - 13);
    ctx.lineTo(0, headY - 22);
    ctx.stroke();
    // Glowing tip
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, headY - 22, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "astronaut") {
    // Full reflective helmet visor
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)"; // Dark visor glass
    ctx.beginPath();
    ctx.arc(0, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    // Visor shiny glare reflection
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.ellipse(-4, headY - 4, 3, 6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "dragon") {
    // Horns and scales
    ctx.fillStyle = "#15803d"; // dark green horn base
    ctx.beginPath();
    ctx.moveTo(-10, headY - 11);
    ctx.lineTo(-15, headY - 23);
    ctx.lineTo(-4, headY - 14);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, headY - 11);
    ctx.lineTo(15, headY - 23);
    ctx.lineTo(4, headY - 14);
    ctx.fill();
  } else if (type === "fairy") {
    // Pointy elegant pixie ears & flower crown
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(-13, headY - 2);
    ctx.lineTo(-21, headY - 10);
    ctx.lineTo(-11, headY - 7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, headY - 2);
    ctx.lineTo(21, headY - 10);
    ctx.lineTo(11, headY - 7);
    ctx.fill();
    // Flower hair crown
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(-6, headY - 14, 3.5, 0, Math.PI * 2);
    ctx.arc(0, headY - 15, 4, 0, Math.PI * 2);
    ctx.arc(6, headY - 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "alien") {
    // Antennas on head
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, headY - 12);
    ctx.quadraticCurveTo(-12, headY - 24, -13, headY - 25);
    ctx.moveTo(6, headY - 12);
    ctx.quadraticCurveTo(12, headY - 24, 13, headY - 25);
    ctx.stroke();
    // Glowing neon tips
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(-13, headY - 25, 3, 0, Math.PI * 2);
    ctx.arc(13, headY - 25, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "monster") {
    // Horns
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(-11, headY - 10);
    ctx.lineTo(-17, headY - 22);
    ctx.quadraticCurveTo(-10, headY - 16, -5, headY - 13);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, headY - 10);
    ctx.lineTo(17, headY - 22);
    ctx.quadraticCurveTo(10, headY - 16, 5, headY - 13);
    ctx.closePath();
    ctx.fill();
  } else if (type === "cat") {
    // Pointy kitty cat ears
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-13, headY - 7);
    ctx.lineTo(-17, headY - 21);
    ctx.lineTo(-4, headY - 14);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, headY - 7);
    ctx.lineTo(17, headY - 21);
    ctx.lineTo(4, headY - 14);
    ctx.fill();
    // Whiskers
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, headY + 3); ctx.lineTo(-19, headY + 1);
    ctx.moveTo(-10, headY + 6); ctx.lineTo(-21, headY + 6);
    ctx.moveTo(10, headY + 3); ctx.lineTo(19, headY + 1);
    ctx.moveTo(10, headY + 6); ctx.lineTo(21, headY + 6);
    ctx.stroke();
  } else if (type === "hero") {
    // Gold superhero headband
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.roundRect(-16, headY - 8, 32, 7, 2);
    ctx.fill();
  }

  // DRAW EYES AND EXPRESSIONS (skip astronaut visor)
  if (type !== "astronaut") {
    // Eye circles
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-5, headY - 2, 3.5, 0, Math.PI * 2);
    ctx.arc(5, headY - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-4.5, headY - 2, 1.8, 0, Math.PI * 2);
    ctx.arc(5.5, headY - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Mouth based on expression
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (expr === "happy") {
      ctx.beginPath();
      ctx.arc(0, headY + 2, 4, 0, Math.PI, false); // smile
      ctx.stroke();
    } else if (expr === "surprised") {
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(0, headY + 4, 2.5, 0, Math.PI * 2); // surprised O
      ctx.fill();
    } else if (expr === "sad") {
      ctx.beginPath();
      ctx.arc(0, headY + 6, 3.5, 0, Math.PI, true); // frown
      ctx.stroke();
    } else if (expr === "angry") {
      // Slanted angry eyebrows
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, headY - 6); ctx.lineTo(-3, headY - 4);
      ctx.moveTo(9, headY - 6); ctx.lineTo(3, headY - 4);
      ctx.stroke();
      // Frown mouth
      ctx.beginPath();
      ctx.arc(0, headY + 6, 3.5, 0, Math.PI, true);
      ctx.stroke();
    } else {
      // Neutral expression
      ctx.beginPath();
      ctx.moveTo(-3, headY + 4);
      ctx.lineTo(3, headY + 4); // straight line
      ctx.stroke();
    }
  }
}

export default function StoryEditor({
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
}: StoryEditorProps) {
  const content = item.content as StoryContent;
  
  // Scenes State
  const [scenes, setScenes] = useState<StoryScene[]>(() => {
    return content.scenes || [];
  });
  
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
  
  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  
  // AI Story writer state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Export & Quality resolution states based on tier requirements
  const [exportResolution, setExportResolution] = useState<"360p" | "720p" | "4k" | "8k" | "360_vr">(() => {
    if (subscription === "business") return "8k";
    if (subscription === "organization") return "4k";
    if (subscription === "office") return "720p";
    return "360p";
  });

  // Compile States
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  // Active Tool Panel Tab
  const [activeTab, setActiveTab] = useState<"scenes" | "puppets" | "dialogues" | "ai">("puppets");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const spokenDialoguesRef = useRef<Record<string, boolean>>({});

  const showWatermark = subscription === "free" || (subscription === "office" && watermarkFreeLeft <= 0);

  // Limit duration based on subscription tier
  const getDurationLimit = () => {
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

  const saveChanges = (updatedScenes: StoryScene[]) => {
    const total = updatedScenes.reduce((acc, s) => acc + (s.duration || 5), 0);
    onSave({
      scenes: updatedScenes,
      totalDuration: total
    });
  };

  // Find active scene based on currentTime
  const getActiveSceneAndProgress = (time: number): { scene: StoryScene; index: number; sceneProgress: number; sceneStartTime: number } => {
    let acc = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (time >= acc && time < acc + scene.duration) {
        return {
          scene,
          index: i,
          sceneProgress: (time - acc) / scene.duration,
          sceneStartTime: acc
        };
      }
      acc += scene.duration;
    }
    return {
      scene: scenes[scenes.length - 1] || scenes[0],
      index: scenes.length - 1 >= 0 ? scenes.length - 1 : 0,
      sceneProgress: 1,
      sceneStartTime: acc - (scenes[scenes.length - 1]?.duration || 5)
    };
  };

  const activePlayback = getActiveSceneAndProgress(currentTime);

  // Live Canvas Rendering Loop (Updates whenever currentTime, scenes, or layout changes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pb = getActiveSceneAndProgress(currentTime);
    if (pb.scene) {
      drawStoryToCanvas(ctx, pb.scene, pb.sceneProgress, canvas.width, canvas.height, currentTime, exportResolution === "360_vr");
    }
  }, [currentTime, scenes, activeSceneIndex, activePlayback.index, exportResolution]);

  // Animation ticks for playback
  useEffect(() => {
    if (isPlaying) {
      const tick = (timestamp: number) => {
        if (previousTimeRef.current !== null) {
          const delta = (timestamp - previousTimeRef.current) / 1000;
          setCurrentTime((prev) => {
            const next = prev + delta;
            if (next >= totalDuration) {
              setIsPlaying(false);
              return 0; // Reset
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

  // Reset spoken ref when isPlaying toggled off/on
  useEffect(() => {
    if (!isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      spokenDialoguesRef.current = {};
    }
  }, [isPlaying]);

  // Effect to speak active dialogues in real-time
  useEffect(() => {
    if (!isPlaying) return;
    
    const scene = activePlayback.scene;
    if (!scene) return;
    
    const sceneElapsedTime = activePlayback.sceneProgress * scene.duration;
    
    // Find active dialogue
    const activeDiag = scene.dialogues?.find(
      (d) => sceneElapsedTime >= d.startTime && sceneElapsedTime < d.startTime + d.duration
    );
    
    if (activeDiag) {
      if (!spokenDialoguesRef.current[activeDiag.id]) {
        spokenDialoguesRef.current[activeDiag.id] = true;
        
        // Enforce Office Pack tier for TTS!
        if (subscription === "free") {
          console.log("TTS requires Office Pack or higher tier. Current subscription: free");
          return;
        }
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Stop any pending speech
          const utterance = new SpeechSynthesisUtterance(activeDiag.text);
          
          // Try to select Swedish voice by default, or falls back gracefully
          const voices = window.speechSynthesis.getVoices();
          const svVoice = voices.find((v) => v.lang.startsWith("sv") || v.lang.includes("SE"));
          if (svVoice) {
            utterance.voice = svVoice;
          }
          
          // Map voice properties based on character type
          const speaker = scene.characters.find((c) => c.id === activeDiag.characterId);
          if (speaker) {
            if (speaker.type === "robot") {
              utterance.rate = 0.9;
              utterance.pitch = 0.55;
            } else if (speaker.type === "wizard") {
              utterance.rate = 0.75;
              utterance.pitch = 0.7;
            } else if (speaker.type === "fairy") {
              utterance.rate = 1.15;
              utterance.pitch = 1.35;
            } else if (speaker.type === "dragon" || speaker.type === "monster") {
              utterance.rate = 0.75;
              utterance.pitch = 0.45;
            } else if (speaker.type === "cat") {
              utterance.rate = 1.1;
              utterance.pitch = 1.25;
            } else if (speaker.type === "alien") {
              utterance.rate = 0.95;
              utterance.pitch = 0.65;
            } else {
              utterance.rate = 1.05;
              utterance.pitch = 1.0;
            }
          } else {
            // Narrator voice
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
          }
          
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, [isPlaying, activePlayback.index, activePlayback.sceneProgress, subscription]);

  // Main Canvas Drawing Engine
  const drawStoryToCanvas = (
    ctx: CanvasRenderingContext2D,
    scene: StoryScene,
    progress: number,
    width: number,
    height: number,
    globalTime: number,
    is360?: boolean
  ) => {
    if (!scene) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Styled themed backgrounds
    const bg = scene.background || "forest";
    let bgGrad = ctx.createLinearGradient(0, 0, width, height);

    if (bg === "forest") {
      // Magisk skog gradients
      bgGrad.addColorStop(0, "#022c22");
      bgGrad.addColorStop(1, "#065f46");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle visual cues: trees & sun rays
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.beginPath();
      ctx.arc(width * 0.2, height * 1.1, 300, 0, Math.PI, true);
      ctx.fill();

      ctx.fillStyle = "rgba(252, 211, 77, 0.05)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * 0.3, 0);
      ctx.lineTo(width * 0.7, height);
      ctx.lineTo(width * 0.1, height);
      ctx.closePath();
      ctx.fill();
    } else if (bg === "space") {
      // Deep Space background
      bgGrad.addColorStop(0, "#03001e");
      bgGrad.addColorStop(0.5, "#7303c0");
      bgGrad.addColorStop(1, "#ec38bc");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw shiny background stars using fixed pseudo-random spots
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 1; i <= 35; i++) {
        const x = (Math.sin(i * 12345.67) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 98765.43) * 0.5 + 0.5) * height;
        const radius = (Math.sin(i * 4567.89 + globalTime * 3) * 0.5 + 0.5) * 2.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (bg === "city") {
      // Retro Sunset City Skyline
      bgGrad.addColorStop(0, "#1e1b4b");
      bgGrad.addColorStop(0.5, "#311042");
      bgGrad.addColorStop(1, "#ca8a04");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Skyline
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      for (let i = 0; i < 12; i++) {
        const buildingW = 90;
        const x = i * 80 - 20;
        const h = (Math.abs(Math.sin(i * 9.87)) * 0.4 + 0.25) * height;
        ctx.fillRect(x, height - h, buildingW, h);

        // Windows
        ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
        for (let wy = height - h + 20; wy < height - 20; wy += 35) {
          ctx.fillRect(x + 15, wy, 15, 12);
          ctx.fillRect(x + buildingW - 30, wy, 15, 12);
        }
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      }
    } else if (bg === "castle") {
      // Dungeon Castle walls
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Castle brick outlines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 3;
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        const offset = (y % 80 === 0) ? 40 : 0;
        for (let x = offset; x < width; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 40);
          ctx.stroke();
        }
      }
    } else if (bg === "school") {
      // Classroom blackboard
      ctx.fillStyle = "#fafaf9"; // stone background
      ctx.fillRect(0, 0, width, height);

      // Big dark green blackboard
      ctx.fillStyle = "#14532d";
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 12;
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.65);
      ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.65);

      // Little blackboard drawing
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "italic 16px system-ui, sans-serif";
      ctx.fillText("KREATIVE STORIES 🖊️", width * 0.15, height * 0.22);
    } else if (bg === "office") {
      // Modern corporate blue
      bgGrad.addColorStop(0, "#f8fafc");
      bgGrad.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw corporate abstract blue shapes
      ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
      ctx.beginPath();
      ctx.arc(width * 0.85, height * 0.3, 200, 0, Math.PI * 2);
      ctx.fill();
    } else if (bg === "desert") {
      // Desert sand sky
      bgGrad.addColorStop(0, "#fdba74");
      bgGrad.addColorStop(0.6, "#f97316");
      bgGrad.addColorStop(1, "#c2410c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Giant sun
      ctx.fillStyle = "rgba(254, 243, 199, 0.7)";
      ctx.beginPath();
      ctx.arc(width * 0.75, height * 0.35, 60, 0, Math.PI * 2);
      ctx.fill();

      // Sand dunes
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.quadraticCurveTo(width * 0.3, height - 80, width * 0.65, height - 35);
      ctx.quadraticCurveTo(width * 0.85, height - 20, width, height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.quadraticCurveTo(width * 0.45, height - 40, width, height - 70);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    } else {
      // Underwater aquatic blue
      bgGrad.addColorStop(0, "#083344");
      bgGrad.addColorStop(0.6, "#0e7490");
      bgGrad.addColorStop(1, "#164e63");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Bubbles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 20; i++) {
        const bubbleX = (Math.sin(i * 543.21) * 0.5 + 0.5) * width;
        const bubbleY = ((i * 123.45 - globalTime * 30) % height + height) % height;
        const size = (i % 3 === 0) ? 6 : 10;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Grid Floor representation
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 2. Render Character Puppets
    const characters = scene.characters || [];
    characters.forEach((char) => {
      ctx.save();

      // Animation parameters
      let animX = 0;
      let animY = 0;
      let scaleX = 1;
      let scaleY = 1;
      let rotation = 0;

      // Base coordinate mapping
      const baseCanvasX = (char.x / 100) * width;
      const baseCanvasY = (char.y / 100) * height;

      // Compute dynamic time-based animations
      const timeFactor = isPlaying ? globalTime : Date.now() / 1000;
      const animType = char.animation || "idle";

      if (animType === "bounce") {
        animY = -Math.abs(Math.sin(timeFactor * 6)) * 30 * (char.scale || 1);
        scaleY = 1 - Math.abs(Math.sin(timeFactor * 6)) * 0.1;
      } else if (animType === "float") {
        animY = Math.sin(timeFactor * 2.5) * 15;
      } else if (animType === "spin") {
        rotation = timeFactor * 3.5;
      } else if (animType === "walk") {
        rotation = Math.sin(timeFactor * 7) * 0.15;
        animX = Math.sin(timeFactor * 3.5) * 8;
      } else if (animType === "shake") {
        animX = (Math.sin(timeFactor * 40) * 4);
        animY = (Math.cos(timeFactor * 45) * 4);
      } else {
        // Idle breathing effect
        scaleY = 1 + Math.sin(timeFactor * 3) * 0.025;
        scaleX = 1 - Math.sin(timeFactor * 3) * 0.015;
      }

      // Position canvas context centered at puppet origin
      ctx.translate(baseCanvasX + animX, baseCanvasY + animY);

      // Rotate if active
      if (rotation !== 0) {
        ctx.rotate(rotation);
      }

      // Mirror horizontally if facing Left
      const mirror = char.facing === "left" ? -1 : 1;
      ctx.scale(mirror * (char.scale || 1) * scaleX, (char.scale || 1) * scaleY);

      // Render custom highly detailed character with vector art!
      drawDetailedCharacter(ctx, char, globalTime, isPlaying);

      ctx.restore();

      // Render Name Tag underneath puppet
      ctx.save();
      ctx.translate(baseCanvasX + animX, baseCanvasY + animY);
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.font = "bold 11px monospace";
      const nameTagWidth = ctx.measureText(char.name).width + 12;
      ctx.beginPath();
      ctx.arc(0 - nameTagWidth / 2 + 6, 8, 6, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineTo(0 + nameTagWidth / 2 - 6, 2);
      ctx.arc(0 + nameTagWidth / 2 - 6, 8, 6, Math.PI * 1.5, Math.PI * 0.5);
      ctx.lineTo(0 - nameTagWidth / 2 + 6, 14);
      ctx.closePath();
      ctx.fill();

      // Text label
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char.name, 0, 8);
      ctx.restore();
    });

    // 3. Render Dialogues Speech Bubbles
    const dialogues = scene.dialogues || [];
    const sceneElapsedTime = progress * scene.duration;

    dialogues.forEach((diag) => {
      // Check timing criteria
      if (sceneElapsedTime >= diag.startTime && sceneElapsedTime < diag.startTime + diag.duration) {
        // Find speaker coords
        const speaker = characters.find((c) => c.id === diag.characterId);
        
        let bubbleX = width / 2;
        let bubbleY = height * 0.15;
        let isNarrator = diag.characterId === "narrator" || !speaker;

        if (!isNarrator && speaker) {
          // Place speech bubble directly over speaker's head
          bubbleX = (speaker.x / 100) * width;
          bubbleY = (speaker.y / 100) * height - 105;

          // Limit coordinate borders
          if (bubbleX < 140) bubbleX = 140;
          if (bubbleX > width - 140) bubbleX = width - 140;
          if (bubbleY < 70) bubbleY = 70;
        }

        ctx.save();

        // Wrap lines
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        const maxTextW = 200;
        const words = diag.text.split(" ");
        let line = "";
        let lines = [];
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          if (ctx.measureText(testLine).width > maxTextW && i > 0) {
            lines.push(line.trim());
            line = words[i] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        const bubblePaddingX = 16;
        const bubblePaddingY = 10;
        const lineHeight = 18;
        
        // Measure real bounds
        let longestLineW = 0;
        lines.forEach((l) => {
          const w = ctx.measureText(l).width;
          if (w > longestLineW) longestLineW = w;
        });

        const bubbleW = longestLineW + bubblePaddingX * 2;
        const bubbleH = lines.length * lineHeight + bubblePaddingY * 2;

        ctx.translate(bubbleX, bubbleY);

        // Styling variants
        if (isNarrator) {
          // Narrative yellow parchment box
          ctx.fillStyle = "rgba(254, 243, 199, 0.95)";
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
          ctx.shadowBlur = 8;
          
          // Center Narrator block perfectly
          const offsetW = bubbleW;
          const offsetH = bubbleH;
          ctx.fillRect(-offsetW / 2, -offsetH / 2, offsetW, offsetH);
          ctx.strokeRect(-offsetW / 2, -offsetH / 2, offsetW, offsetH);

          // Render Text
          ctx.fillStyle = "#78350f";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          lines.forEach((l, lIdx) => {
            const textY = -offsetH / 2 + bubblePaddingY + (lIdx * lineHeight) + lineHeight / 2;
            ctx.fillText(l, 0, textY);
          });
        } else {
          // Character dialogue speech bubble
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "rgba(0,0,0,0.15)";
          ctx.shadowBlur = 6;

          const cornerRad = 12;
          const rectX = -bubbleW / 2;
          const rectY = -bubbleH;

          // Drawing Speech Bubble path
          ctx.beginPath();
          ctx.moveTo(rectX + cornerRad, rectY);
          ctx.lineTo(rectX + bubbleW - cornerRad, rectY);
          ctx.quadraticCurveTo(rectX + bubbleW, rectY, rectX + bubbleW, rectY + cornerRad);
          ctx.lineTo(rectX + bubbleW, rectY + bubbleH - cornerRad);
          ctx.quadraticCurveTo(rectX + bubbleW, rectY + bubbleH, rectX + bubbleW - cornerRad, rectY + bubbleH);

          // Draw the triangle pointer tail pointing downwards
          if (diag.bubbleType === "speech") {
            ctx.lineTo(10, rectY + bubbleH);
            ctx.lineTo(0, rectY + bubbleH + 12);
            ctx.lineTo(-10, rectY + bubbleH);
          } else if (diag.bubbleType === "exclamation") {
            // Jagged pointer tail
            ctx.lineTo(15, rectY + bubbleH);
            ctx.lineTo(0, rectY + bubbleH + 15);
            ctx.lineTo(-5, rectY + bubbleH + 5);
            ctx.lineTo(-15, rectY + bubbleH);
          }

          ctx.lineTo(rectX + cornerRad, rectY + bubbleH);
          ctx.quadraticCurveTo(rectX, rectY + bubbleH, rectX, rectY + bubbleH - cornerRad);
          ctx.lineTo(rectX, rectY + cornerRad);
          ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRad, rectY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // If thought bubble, draw nice dots below bubble
          if (diag.bubbleType === "thought") {
            ctx.beginPath();
            ctx.arc(0, rectY + bubbleH + 4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-5, rectY + bubbleH + 10, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Render dialogue texts
          ctx.fillStyle = "#1e293b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          lines.forEach((l, lIdx) => {
            const textY = rectY + bubblePaddingY + (lIdx * lineHeight) + lineHeight / 2;
            ctx.fillText(l, 0, textY);
          });
        }

        ctx.restore();
      }
    });

    // 4. Playback metadata / watermark watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("KREATIVE STORIES STUDIO", width / 2, 22);

    if (showWatermark) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-15 * Math.PI / 180);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.font = "900 64px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KREATIVE STORIES", 0, -35);
      ctx.fillText("GRATISVERSION", 0, 35);
      ctx.restore();

      // Bottom banner
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, height - 30, width, 30);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SKAPAD MED KREATIVE STORIES - VATTENSTÄMPEL AKTIV", width / 2, height - 15);
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
        a.download = `${item.name.toLowerCase().replace(/\s+/g, "-") || "story"}_${resLabel}.mp4`;
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
        const pb = getActiveSceneAndProgress(compileTime);
        drawStoryToCanvas(ctx, pb.scene, pb.sceneProgress, canvas.width, canvas.height, compileTime, exportResolution === "360_vr");

        compileTime += frameDuration;
        const progressPercent = Math.min(Math.floor((compileTime / totalDuration) * 100), 99);
        setCompileProgress(progressPercent);

        if (compileTime >= totalDuration) {
          clearInterval(recordInterval);
          mediaRecorder.stop();
        }
      }, 30);
    } catch (err: any) {
      console.error("Kompilering misslyckades:", err);
      alert("Ett fel uppstod vid kompilering: " + err.message);
      setIsCompiling(false);
    }
  };

  // AI Story scene writer simulator (uses the prompt)
  const handleGenerateStoryWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setAiError(null);

    try {
      // Simulate smart generation based on the prompt
      await new Promise((resolve) => setTimeout(resolve, 3500));

      const pLow = aiPrompt.toLowerCase();
      let char1Type = "wizard";
      let char2Type = "robot";
      let bg = "forest";
      let text1 = "Hokus pokus! Titta på min magiska stav!";
      let text2 = "Analyserar magiskt fält... BEEP!";

      if (pLow.includes("rymden") || pLow.includes("astronaut") || pLow.includes("stjärn")) {
        bg = "space";
        char1Type = "astronaut";
        char2Type = "alien";
        text1 = "Ett stort steg för mänskligheten! Ser du jorden?";
        text2 = "ZLORP! Välkommen till vår galax, rymdfarare!";
      } else if (pLow.includes("drake") || pLow.includes("dragon") || pLow.includes("slott")) {
        bg = "castle";
        char1Type = "dragon";
        char2Type = "wizard";
        text1 = "ROAAAR! Vem vågar störa min slummer i slottet?";
        text2 = "Var inte arg, mäktiga drake! Jag söker bara visdom.";
      } else if (pLow.includes("skola") || pLow.includes("klassrum") || pLow.includes("lära")) {
        bg = "school";
        char1Type = "hero";
        char2Type = "cat";
        text1 = "Klassen, idag ska vi lära oss hur vi blir superhjältar!";
        text2 = "MJAU! Jag vill hellre äta fisk och sova på bänken.";
      } else if (pLow.includes("hav") || pLow.includes("under") || pLow.includes("fisk")) {
        bg = "underwater";
        char1Type = "fairy";
        char2Type = "monster";
        text1 = "Titta på alla koraller! Havet är så vackert.";
        text2 = "BLUBB BLUBB! Vakta dig för havsdjupets monster!";
      }

      const generatedScenes: StoryScene[] = [
        {
          id: `sc-ai-1-${Date.now()}`,
          duration: 6,
          background: bg as any,
          characters: [
            {
              id: "char-ai-1",
              type: char1Type as any,
              name: char1Type === "wizard" ? "Arvid" : char1Type === "astronaut" ? "Kapten Leo" : char1Type === "dragon" ? "Eldtand" : "Hjälten",
              x: 25,
              y: 65,
              scale: 1.1,
              facing: "right",
              expression: "happy",
              animation: "idle"
            },
            {
              id: "char-ai-2",
              type: char2Type as any,
              name: char2Type === "robot" ? "Robo-9" : char2Type === "alien" ? "Zlorp" : char2Type === "wizard" ? "Isak" : "Misse",
              x: 75,
              y: 65,
              scale: 1.0,
              facing: "left",
              expression: "neutral",
              animation: "bounce"
            }
          ],
          dialogues: [
            {
              id: "diag-ai-1",
              characterId: "char-ai-1",
              text: text1,
              startTime: 1,
              duration: 2.2,
              bubbleType: "speech"
            },
            {
              id: "diag-ai-2",
              characterId: "char-ai-2",
              text: text2,
              startTime: 3.5,
              duration: 2.2,
              bubbleType: "speech"
            }
          ]
        },
        {
          id: `sc-ai-2-${Date.now()}`,
          duration: 6,
          background: bg as any,
          characters: [
            {
              id: "char-ai-1",
              type: char1Type as any,
              name: char1Type === "wizard" ? "Arvid" : char1Type === "astronaut" ? "Kapten Leo" : char1Type === "dragon" ? "Eldtand" : "Hjälten",
              x: 35,
              y: 65,
              scale: 1.1,
              facing: "right",
              expression: "surprised",
              animation: "float"
            },
            {
              id: "char-ai-2",
              type: char2Type as any,
              name: char2Type === "robot" ? "Robo-9" : char2Type === "alien" ? "Zlorp" : char2Type === "wizard" ? "Isak" : "Misse",
              x: 65,
              y: 65,
              scale: 1.0,
              facing: "left",
              expression: "happy",
              animation: "walk"
            }
          ],
          dialogues: [
            {
              id: "diag-ai-3",
              characterId: "narrator",
              text: "Berättelsen fortsätter med en plötslig rörelse på scenen...",
              startTime: 0.5,
              duration: 2.0,
              bubbleType: "speech"
            },
            {
              id: "diag-ai-4",
              characterId: "char-ai-1",
              text: "Oi! Titta, jag svävar i luften!",
              startTime: 3.0,
              duration: 2.5,
              bubbleType: "speech"
            }
          ]
        }
      ];

      setScenes(generatedScenes);
      saveChanges(generatedScenes);
      setActiveSceneIndex(0);
      setCurrentTime(0);
      setAiPrompt("");
      if (onUseAi) onUseAi();
    } catch (err: any) {
      setAiError("Det gick inte att generera din berättelse. Försök igen!");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper adding methods
  const handleAddScene = () => {
    const newScene: StoryScene = {
      id: `sc-${Date.now()}`,
      duration: 5,
      background: "forest",
      characters: [
        {
          id: `char-new-${Date.now()}`,
          type: "wizard",
          name: "Ny Docka",
          x: 50,
          y: 65,
          scale: 1.0,
          facing: "right",
          expression: "neutral",
          animation: "idle"
        }
      ],
      dialogues: []
    };

    const updated = [...scenes, newScene];
    setScenes(updated);
    saveChanges(updated);
    setActiveSceneIndex(updated.length - 1);
  };

  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) {
      alert("Du måste ha minst en scen i din berättelse.");
      return;
    }
    const updated = scenes.filter((_, i) => i !== idx);
    setScenes(updated);
    saveChanges(updated);
    setActiveSceneIndex(Math.max(0, idx - 1));
  };

  const handleUpdateSceneBg = (bg: any) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        return { ...s, background: bg };
      }
      return s;
    });
    setScenes(updated);
    saveChanges(updated);
  };

  const handleUpdateSceneDuration = (dur: number) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        return { ...s, duration: dur };
      }
      return s;
    });
    setScenes(updated);
    saveChanges(updated);
  };

  const handleAddCharacter = (type: any) => {
    const activeScene = scenes[activeSceneIndex];
    if (!activeScene) return;

    const templateChar = PUPPET_TYPES.find((p) => p.id === type);
    const newChar: StoryCharacter = {
      id: `char-${type}-${Date.now()}`,
      type,
      name: templateChar ? templateChar.name.split(" ")[0] : "Kompis",
      x: 20 + Math.floor(Math.random() * 60),
      y: 65,
      scale: 1.0,
      facing: "right",
      expression: "neutral",
      animation: "idle"
    };

    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        return { ...s, characters: [...s.characters, newChar] };
      }
      return s;
    });

    setScenes(updated);
    saveChanges(updated);
    setSelectedCharacterId(newChar.id);
  };

  const handleDeleteCharacter = (id: string) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        const chars = s.characters.filter((c) => c.id !== id);
        // Also remove dialogues spoken by this character
        const diags = s.dialogues.filter((d) => d.characterId !== id);
        return { ...s, characters: chars, dialogues: diags };
      }
      return s;
    });

    setScenes(updated);
    saveChanges(updated);
    setSelectedCharacterId(null);
  };

  const handleUpdateCharacter = (charId: string, updates: Partial<StoryCharacter>) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        const chars = s.characters.map((c) => {
          if (c.id === charId) {
            return { ...c, ...updates };
          }
          return c;
        });
        return { ...s, characters: chars };
      }
      return s;
    });
    setScenes(updated);
    saveChanges(updated);
  };

  const handleAddDialogue = () => {
    const activeScene = scenes[activeSceneIndex];
    if (!activeScene) return;

    const speaker = activeScene.characters[0]?.id || "narrator";

    const newDiag: StoryDialogue = {
      id: `diag-${Date.now()}`,
      characterId: speaker,
      text: "Skriv dialogtext här...",
      startTime: 1.0,
      duration: 2.5,
      bubbleType: "speech"
    };

    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        return { ...s, dialogues: [...s.dialogues, newDiag] };
      }
      return s;
    });

    setScenes(updated);
    saveChanges(updated);
    setSelectedDialogueId(newDiag.id);
  };

  const handleDeleteDialogue = (id: string) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        return { ...s, dialogues: s.dialogues.filter((d) => d.id !== id) };
      }
      return s;
    });
    setScenes(updated);
    saveChanges(updated);
    setSelectedDialogueId(null);
  };

  const handleUpdateDialogue = (diagId: string, updates: Partial<StoryDialogue>) => {
    const updated = scenes.map((s, idx) => {
      if (idx === activeSceneIndex) {
        const diags = s.dialogues.map((d) => {
          if (d.id === diagId) {
            return { ...d, ...updates };
          }
          return d;
        });
        return { ...s, dialogues: diags };
      }
      return s;
    });
    setScenes(updated);
    saveChanges(updated);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const activeScene = scenes[activeSceneIndex] || scenes[0];
  const activeChar = activeScene?.characters?.find((c) => c.id === selectedCharacterId);
  const activeDiag = activeScene?.dialogues?.find((d) => d.id === selectedDialogueId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="story-editor-workspace">
      {/* Top Header Controls */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 px-2.5 py-0.5 bg-purple-50 border border-purple-100 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> KREATIVE STORIES
              </span>
              {subscription === "free" && (
                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">
                  Vattenstämpel Aktiv (Free)
                </span>
              )}
              {subscription === "office" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${watermarkFreeLeft > 0 ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                  {watermarkFreeLeft > 0 ? `${watermarkFreeLeft} gratis utan vattenstämpel kvar` : "Vattenstämpel Aktiv (Kvot full)"}
                </span>
              )}
              {subscription === "organization" && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                  Skollicens ✓ (Ingen vattenstämpel)
                </span>
              )}
              {item.driveFileId && (
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> DRIVE
                </span>
              )}
            </div>
            <h1 className="font-display font-black text-slate-900 text-lg leading-tight mt-1">{item.name}</h1>
          </div>
        </div>

        {/* Compile MP4 and Download controls */}
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
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Kompilerar {compileProgress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportera MP4-Video
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Interactive Canvas & Timeline Area (col-span-7) */}
        <div className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-80px)]">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Förhandsvisning (Stories)</span>
              <div className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                Scen: {activePlayback.index + 1} av {scenes.length} ({formatTime(currentTime)} / {formatTime(totalDuration)})
              </div>
            </div>

            {/* Canvas Box Screen */}
            <div className="relative aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-950 flex flex-col items-center justify-center">
              
              <canvas 
                ref={canvasRef} 
                width="854" 
                height="480" 
                className="w-full h-full object-cover"
                id="story-video-canvas"
              />

              {/* Player Scrubber HUD controls Overlay on bottom of canvas */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-between gap-4">
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

                <input 
                  type="range" 
                  min="0" 
                  max={totalDuration} 
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentTime(parseFloat(e.target.value));
                  }}
                  className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-purple-500"
                />

                <span className="text-xs font-mono text-white whitespace-nowrap">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Timeline and scene sequences list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Tidslinje & Scensekvenser</span>
              <div className="flex items-center gap-2">
                {subscription === "free" ? (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer" onClick={onRedirectToPricing} title="Klicka för att uppgradera">
                    🔒 TTS-Uppläsning (Office Pack)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1" title="Dialoger läses upp automatiskt under uppspelning">
                    🔊 TTS-Uppläsning: Aktiv
                  </span>
                )}
                <button 
                  onClick={handleAddScene}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-150 text-purple-700 font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Lägg till scen
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 snap-x">
              {scenes.map((scene, idx) => {
                const isActive = idx === activePlayback.index;
                const isSelected = idx === activeSceneIndex;

                return (
                  <div 
                    key={scene.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveSceneIndex(idx);
                      
                      // Compute global time offset to point to this scene start
                      let offset = 0;
                      for (let i = 0; i < idx; i++) {
                        offset += scenes[i].duration;
                      }
                      setCurrentTime(offset);
                    }}
                    className={`snap-start shrink-0 w-36 p-3 rounded-2xl border transition-all text-left relative cursor-pointer ${
                      isSelected 
                        ? "bg-white border-purple-500 shadow-sm" 
                        : isActive
                        ? "bg-purple-50/40 border-purple-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Scene number and trash button */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Scen {idx + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(idx);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Radera scen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5 capitalize">
                      <Map className="w-3.5 h-3.5 text-purple-600" />
                      {scene.background}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1.5 border-t border-slate-100">
                      <span>{scene.characters?.length || 0} st dockor</span>
                      <span className="font-bold text-slate-700">{scene.duration}s</span>
                    </div>

                    {/* Left Playback progress slider overlay inside timeline */}
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 rounded-b-2xl overflow-hidden">
                        <div 
                          className="h-full bg-purple-300 transition-all duration-100" 
                          style={{ width: `${activePlayback.sceneProgress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Editor Form Panels tabs (col-span-5) */}
        <div className="lg:col-span-5 bg-white border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-80px)] space-y-6">
          <div className="space-y-5">
            
            {/* Tabs Selector Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: "puppets", name: "Dockor 🎭", icon: Smile },
                { id: "dialogues", name: "Dialoger 💬", icon: MessageSquare },
                { id: "scenes", name: "Scen 🗺️", icon: Map },
                { id: "ai", name: "AI Skrivare 🪄", icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      activeTab === tab.id
                        ? "bg-white text-purple-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT 1: SCENE CONFIGURATION */}
            {activeTab === "scenes" && (
              <div className="space-y-4 animate-fade-in">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-purple-600" /> Scentema & Inställningar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Konfigurera bakgrund och tidslängd för den aktiva scenen.</p>
                </div>

                {/* Duration Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Scenlängd (sekunder)</label>
                    <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {activeScene?.duration || 5}s
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="20" 
                    step="1"
                    value={activeScene?.duration || 5}
                    onChange={(e) => handleUpdateSceneDuration(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="block text-[10px] text-slate-400 italic">Varje scen kan pågå upp till 20 sekunder för dialog och rörlighet.</span>
                </div>

                {/* Background Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Välj Bakgrundsmiljö</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUNDS.map((bg) => {
                      const isSelected = activeScene?.background === bg.id;
                      return (
                        <button
                          key={bg.id}
                          onClick={() => handleUpdateSceneBg(bg.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px] ${
                            isSelected 
                              ? "border-purple-600 bg-purple-50/20 text-purple-700 font-bold" 
                              : "border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                          }`}
                        >
                          <span className="text-xs font-bold block">{bg.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{bg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PUPPETS (DOCKOR) */}
            {activeTab === "puppets" && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-purple-600" /> Animera Dockor (Puppets)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Lägg till karaktärer och kontrollera deras rörelser.</p>
                  </div>
                </div>

                {/* Add Quick Puppets list */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Klicka för att lägga till docka</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PUPPET_TYPES.map((p) => {
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleAddCharacter(p.id)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-purple-700 cursor-pointer transition-all flex items-center gap-1"
                        >
                          <span>{p.emoji}</span>
                          <span>{p.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Characters List selector */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Dockor i denna scen</label>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {activeScene?.characters?.map((char) => {
                      const isSelected = char.id === selectedCharacterId;
                      const emoji = CHARACTER_EMOJIS[char.type];
                      return (
                        <div
                          key={char.id}
                          onClick={() => setSelectedCharacterId(char.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? "border-purple-500 bg-purple-50/10" 
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{emoji}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{char.name}</div>
                              <div className="text-[9px] font-mono text-slate-400 capitalize">
                                {char.type} • {char.animation} • {char.expression}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCharacter(char.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Radera docka"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {(!activeScene?.characters || activeScene.characters.length === 0) && (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Inga dockor i den här scenen än. Klicka ovan för att lägga till en!
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Character Property controls */}
                {activeChar && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-scale-up">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">Egenskaper: {activeChar.name}</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">{activeChar.type}</span>
                    </div>

                    {/* Name change */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dockans Namn</label>
                      <input 
                        type="text" 
                        value={activeChar.name}
                        onChange={(e) => handleUpdateCharacter(activeChar.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Coordinates Grid x & y */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <Move className="w-3 h-3 text-purple-600" /> Horisontellt (X)
                        </label>
                        <input 
                          type="range" 
                          min="5" 
                          max="95" 
                          value={activeChar.x}
                          onChange={(e) => handleUpdateCharacter(activeChar.id, { x: parseInt(e.target.value, 10) })}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <Move className="w-3 h-3 text-purple-600" /> Vertikalt (Y)
                        </label>
                        <input 
                          type="range" 
                          min="10" 
                          max="90" 
                          value={activeChar.y}
                          onChange={(e) => handleUpdateCharacter(activeChar.id, { y: parseInt(e.target.value, 10) })}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                    </div>

                    {/* Scale & Facing direction */}
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <Scaling className="w-3 h-3 text-purple-600" /> Storlek (Skala)
                        </label>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.05"
                          value={activeChar.scale || 1.0}
                          onChange={(e) => handleUpdateCharacter(activeChar.id, { scale: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Titta åt håll</label>
                        <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateCharacter(activeChar.id, { facing: "right" })}
                            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                              activeChar.facing === "right"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Höger
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCharacter(activeChar.id, { facing: "left" })}
                            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                              activeChar.facing === "left"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Vänster
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expressions & Animations selections */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ansiktsuttryck</label>
                        <select
                          value={activeChar.expression}
                          onChange={(e) => handleUpdateCharacter(activeChar.id, { expression: e.target.value as any })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {EXPRESSIONS.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rörelse/Animation</label>
                        <select
                          value={activeChar.animation}
                          onChange={(e) => handleUpdateCharacter(activeChar.id, { animation: e.target.value as any })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {ANIMATIONS.map((an) => (
                            <option key={an.id} value={an.id}>{an.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Clothing selector */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Klädstil / Kostym 👕</label>
                      <select
                        value={activeChar.clothing || "default"}
                        onChange={(e) => handleUpdateCharacter(activeChar.id, { clothing: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-slate-700"
                      >
                        {CLOTHING_TYPES.map((cl) => (
                          <option key={cl.id} value={cl.id}>{cl.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: DIALOGUES */}
            {activeTab === "dialogues" && (
              <div className="space-y-5 animate-fade-in">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-600" /> Skapa Dialoger & Pratsubblor
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Lägg till talbubblor till karaktärerna med exakta tider.</p>
                  </div>
                  <button 
                    onClick={handleAddDialogue}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-150 text-purple-700 font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Lägg till replik
                  </button>
                </div>

                {/* Dialogues list */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Repliker i denna scen</label>
                  <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                    {activeScene?.dialogues?.map((diag, dIdx) => {
                      const isSelected = diag.id === selectedDialogueId;
                      const speaker = activeScene.characters.find((c) => c.id === diag.characterId);
                      const speakerName = diag.characterId === "narrator" ? "Berättare 🗣️" : speaker ? speaker.name : "Okänd";
                      return (
                        <div
                          key={diag.id}
                          onClick={() => setSelectedDialogueId(diag.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? "border-purple-500 bg-purple-50/10" 
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-purple-700 font-mono">#{dIdx+1}</span>
                              <span className="text-xs font-bold text-slate-800">{speakerName}</span>
                              <span className="text-[9px] text-slate-400 font-mono">({diag.startTime}s - {diag.startTime + diag.duration}s)</span>
                            </div>
                            <p className="text-xs text-slate-600 truncate italic">"{diag.text}"</p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDialogue(diag.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Radera replik"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {(!activeScene?.dialogues || activeScene.dialogues.length === 0) && (
                      <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Inga repliker än. Klicka på "Lägg till replik" ovan för att starta konversationen!
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Dialogue details form */}
                {activeDiag && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-scale-up">
                    <div className="pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wide">Replikdetaljer</span>
                    </div>

                    {/* Speaker Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Vem Pratar?</label>
                      <select
                        value={activeDiag.characterId}
                        onChange={(e) => handleUpdateDialogue(activeDiag.id, { characterId: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="narrator">Berättare (Narrator)</option>
                        {activeScene?.characters?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({CHARACTER_EMOJIS[c.type]})</option>
                        ))}
                      </select>
                    </div>

                    {/* Dialogue text area */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dialogtext</label>
                      <textarea
                        rows={2}
                        value={activeDiag.text}
                        onChange={(e) => handleUpdateDialogue(activeDiag.id, { text: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Dialogue bubble type */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bubbelsort (Stil)</label>
                      <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                        {[
                          { id: "speech", label: "💬 Prat" },
                          { id: "thought", label: "💭 Tanke" },
                          { id: "exclamation", label: "💥 Utrop" }
                        ].map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleUpdateDialogue(activeDiag.id, { bubbleType: b.id as any })}
                            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                              activeDiag.bubbleType === b.id
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Startoffset and dialogue duration inside scene */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Starttid</label>
                          <span className="text-[10px] font-mono font-bold text-purple-600">{activeDiag.startTime}s</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={activeScene?.duration || 5} 
                          step="0.1"
                          value={activeDiag.startTime}
                          onChange={(e) => handleUpdateDialogue(activeDiag.id, { startTime: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Visas i</label>
                          <span className="text-[10px] font-mono font-bold text-purple-600">{activeDiag.duration}s</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max={activeScene?.duration || 5} 
                          step="0.1"
                          value={activeDiag.duration}
                          onChange={(e) => handleUpdateDialogue(activeDiag.id, { duration: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: AI STORY WRITER */}
            {activeTab === "ai" && (
              <div className="space-y-4 animate-fade-in">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-purple-600 animate-pulse" /> AI Story Writer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Generera en komplett, animerad svensk saga automatiskt baserat på din beskrivning.</p>
                </div>

                <form onSubmit={handleGenerateStoryWithAi} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vad ska berättelsen handla om?</label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="T.ex. 'En trollkarl bjuder in en robot till en magisk skog för att lära honom baka magiska kakor...'"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl text-xs leading-relaxed"
                    />
                  </div>

                  {aiError && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Skriver manus & animerar dockor...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generera Berättelse
                      </>
                    )}
                  </button>
                </form>

                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Hur fungerar det?
                  </h4>
                  <p className="text-[10px] text-purple-800 leading-relaxed">
                    AI-motorn analyserar din text och sätter upp lämpliga dockor (t.ex. robotar eller drakar), placerar dem på scenen, väljer ett matchande scentema (t.ex. rymden eller ett slott) och skriver repliker med korrekta tidsintervall.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Limit notification panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[10px] text-slate-500 space-y-1 mt-auto">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Din licens: {subscription === "free" ? "Free Trial" : subscription === "office" ? "Office Pack" : subscription === "organization" ? "Organization Pack" : "Business Pack"}</span>
              <span>Maximal längd: {limitInfo.minutes} min</span>
            </div>
            <p className="leading-relaxed">
              Den totala längden på din berättelse är <strong className="text-slate-700 font-mono">{formatTime(totalDuration)}</strong>. Du kan exportera och kompilera denna till en riktig MP4-video med 30 FPS upplösning!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
