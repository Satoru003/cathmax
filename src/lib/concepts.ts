import { concepts } from "@/data/concepts";
import { Category, Concept } from "@/lib/types";

// Shuffle using Fisher-Yates
function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let shuffled: Concept[] | null = null;

function getShuffled(): Concept[] {
  if (!shuffled) {
    shuffled = shuffle(concepts);
  }
  return shuffled;
}

export function getConcepts(
  cursor: number,
  limit: number,
  category?: Category
): { items: Concept[]; nextCursor: number | null } {
  const source = category
    ? getShuffled().filter((c) => c.category === category)
    : getShuffled();

  // Wrap around for infinite scroll
  const items: Concept[] = [];
  for (let i = 0; i < limit; i++) {
    const idx = (cursor + i) % source.length;
    items.push(source[idx]);
  }

  const nextCursor = cursor + limit;
  return { items, nextCursor };
}

export function getCategories(): { category: Category; count: number }[] {
  const counts = new Map<Category, number>();
  for (const c of concepts) {
    counts.set(c.category, (counts.get(c.category) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function searchConcepts(query: string): Concept[] {
  const q = query.toLowerCase();
  return concepts.filter(
    (c) =>
      c.term.toLowerCase().includes(q) ||
      c.oneLiner.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
  );
}
