export type SubscriptionType = "free" | "office" | "organization" | "business";

export type ItemType = "page" | "presentation" | "document" | "video" | "story";

export interface PageSectionItem {
  title?: string;
  description?: string;
  name?: string;
  price?: string;
  features?: string[];
}

export interface PageSection {
  id: string;
  type: "hero" | "features" | "content" | "pricing" | "contact";
  title: string;
  subtitle?: string;
  content?: string;
  items?: PageSectionItem[];
}

export interface PageContent {
  pageTitle: string;
  metaDescription?: string;
  colorTheme: "modern" | "dark" | "warm" | "brutalist";
  sections: PageSection[];
}

export interface Slide {
  id: string;
  title: string;
  body: string;
  layout: "split" | "center" | "bullets" | "hero";
}

export interface PresentationContent {
  slides: Slide[];
}

export interface DocumentContent {
  markdown: string;
}

export interface VideoScene {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  duration: number; // in seconds
  backgroundGradient: string; // Tailwind class string, e.g. "from-slate-900 to-indigo-900"
  textColor: string; // e.g. "text-white"
  animationType: "fade" | "slide-up" | "scale-up" | "slide-left" | "blur";
}

export interface VideoContent {
  scenes: VideoScene[];
  totalDuration: number; // in seconds
}

export interface StoryCharacter {
  id: string;
  type: "hero" | "wizard" | "robot" | "dragon" | "fairy" | "alien" | "monster" | "cat" | "astronaut";
  name: string;
  x: number; // 0 to 100 percent
  y: number; // 0 to 100 percent
  scale: number; // 0.5 to 1.5
  facing: "left" | "right";
  expression: "happy" | "surprised" | "sad" | "angry" | "neutral";
  animation: "idle" | "bounce" | "float" | "spin" | "walk" | "shake";
  clothing?: string;
}

export interface StoryDialogue {
  id: string;
  characterId: string; // character id or "narrator"
  text: string;
  startTime: number; // in seconds from scene start
  duration: number; // in seconds
  bubbleType: "speech" | "thought" | "exclamation";
}

export interface StoryScene {
  id: string;
  duration: number; // in seconds
  background: "forest" | "space" | "city" | "castle" | "school" | "office" | "desert" | "underwater";
  bgMusic?: string;
  characters: StoryCharacter[];
  dialogues: StoryDialogue[];
}

export interface StoryContent {
  scenes: StoryScene[];
  totalDuration: number; // in seconds
}

export interface KreativeItem {
  id: string;
  name: string;
  type: ItemType;
  createdAt: string;
  updatedAt: string;
  content: PageContent | PresentationContent | DocumentContent | VideoContent | StoryContent;
  driveFileId?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  isPremium: boolean; // Needs Office Pack or Organization Pack
  isOrgOnly?: boolean; // Needs Organization Pack
  content: any;
}
