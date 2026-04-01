export interface Concept {
  id: string;
  term: string;
  category: Category;
  tags: string[];
  oneLiner: string;
  body: string;
  example?: string;
  whyItMatters: string;
  relatedTerms: string[];
}

export type Category =
  | "saints"
  | "sacraments"
  | "scripture"
  | "prayers"
  | "doctrine"
  | "morality"
  | "church-history"
  | "mary"
  | "liturgy"
  | "virtues"
  | "apologetics"
  | "social-teaching"
  | "tradition"
  | "devotions";

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  saints: { label: "Saints", icon: "halo", color: "#f59e0b" },
  sacraments: { label: "Sacraments", icon: "chalice", color: "#8b5cf6" },
  scripture: { label: "Scripture", icon: "book", color: "#3b82f6" },
  prayers: { label: "Prayers", icon: "hands", color: "#14b8a6" },
  doctrine: { label: "Doctrine", icon: "shield", color: "#f43f5e" },
  morality: { label: "Moral Theology", icon: "scale", color: "#10b981" },
  "church-history": { label: "Church History", icon: "clock", color: "#6366f1" },
  mary: { label: "Marian Devotion", icon: "star", color: "#06b6d4" },
  liturgy: { label: "Liturgy", icon: "candle", color: "#ec4899" },
  virtues: { label: "Virtues", icon: "heart", color: "#84cc16" },
  apologetics: { label: "Apologetics", icon: "message", color: "#f97316" },
  "social-teaching": { label: "Social Teaching", icon: "people", color: "#a855f7" },
  tradition: { label: "Sacred Tradition", icon: "scroll", color: "#eab308" },
  devotions: { label: "Devotions", icon: "flame", color: "#0ea5e9" },
};
