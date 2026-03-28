"use client";

import { useState, useMemo } from "react";
import { Category } from "@/lib/types";
import { concepts } from "@/data/concepts";
import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";
import { CATEGORY_META } from "@/lib/types";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const c of concepts) {
      counts.set(c.category, (counts.get(c.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  return (
    <div className="flex justify-center min-h-screen">
      {/* Left sidebar - X style nav */}
      <div className="w-[275px] shrink-0 border-r border-[var(--border)] hidden lg:block">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />
      </div>

      {/* Main feed */}
      <main className="w-full max-w-[600px] border-r border-[var(--border)]">
        {/* Mobile category bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">infomaxxing</h1>
          </div>
          <div className="flex overflow-x-auto px-2 pb-2 gap-2" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-[var(--foreground)] text-black"
                  : "bg-[var(--card)] text-[var(--foreground)]"
              }`}
            >
              All
            </button>
            {categories.map(({ category }) => (
              <button
                key={category}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category ? null : category
                  )
                }
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "text-white"
                    : "bg-[var(--card)] text-[var(--foreground)]"
                }`}
                style={
                  activeCategory === category
                    ? { backgroundColor: CATEGORY_META[category].color }
                    : undefined
                }
              >
                {CATEGORY_META[category].label}
              </button>
            ))}
          </div>
        </div>

        <Feed category={activeCategory} />
      </main>

      {/* Right sidebar */}
      <div className="w-[350px] shrink-0 pl-6 pr-4 hidden xl:block">
        <RightSidebar concepts={concepts} />
      </div>
    </div>
  );
}
