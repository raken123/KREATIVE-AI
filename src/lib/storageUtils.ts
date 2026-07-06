import { KreativeItem, SubscriptionType } from "../types";

export function getItemSize(item: KreativeItem): number {
  if (!item || !item.content) return 1024; // fallback 1KB

  switch (item.type) {
    case "video": {
      const content = item.content as any;
      const scenes = content.scenes || [];
      const duration = scenes.reduce((acc: number, scene: any) => acc + (scene.duration || 5), 0);
      // Let's estimate 18.5 MB per second of video
      return Math.max(1024 * 1024, Math.round(duration * 18.5 * 1024 * 1024));
    }
    case "presentation": {
      const content = item.content as any;
      const slides = content.slides || [];
      // Let's estimate 12.4 MB per slide
      return Math.max(1024 * 1024, Math.round(slides.length * 12.4 * 1024 * 1024));
    }
    case "page": {
      const content = item.content as any;
      const sections = content.sections || [];
      // Let's estimate 4.8 MB per section
      return Math.max(1024 * 1024, Math.round(sections.length * 4.8 * 1024 * 1024));
    }
    case "document": {
      const content = item.content as any;
      const markdown = content.markdown || "";
      // Let's estimate 120 bytes per character plus some overhead
      return Math.round(markdown.length * 120 + 250 * 1024); // 250 KB base + text
    }
    default:
      return 1024;
  }
}

export function getSubscriptionStorageLimit(subscription: SubscriptionType): number {
  switch (subscription) {
    case "free":
      return 1 * 1024 * 1024 * 1024; // 1 GB
    case "office":
      return 500 * 1024 * 1024 * 1024; // 500 GB
    case "organization":
      return 10 * 1024 * 1024 * 1024 * 1024; // 10 TB
    case "business":
      return 1000 * 1024 * 1024 * 1024 * 1024; // 1000 TB (Oändligt i praktiken)
    default:
      return 1 * 1024 * 1024 * 1024;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
