"use client";

import { Category, CATEGORY_META } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

interface SidebarProps {
  activeCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
  categories: { category: Category; count: number }[];
  aiMode?: boolean;
  onAiModeToggle?: () => void;
}

export function Sidebar({
  activeCategory,
  onCategoryChange,
  categories,
  aiMode,
  onAiModeToggle,
}: SidebarProps) {
  return (
    <nav className="sticky top-0 h-screen flex flex-col justify-between py-3 px-2">
      <div className="space-y-0.5">
        {/* Logo */}
        <div className="px-3 py-3 mb-2">
          <h1 className="text-xl font-bold text-[var(--foreground)] uppercase">
            catholic<span className="text-[#ff1744]">maxxx</span>ing
          </h1>
        </div>

        {/* AI Gen Threads toggle */}
        <button
          onClick={onAiModeToggle}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-full transition-colors text-left ${
            aiMode
              ? "font-bold text-[#00e676] bg-[#00e676]/10 ring-1 ring-[#00e676]/30"
              : "text-[var(--foreground)] hover:bg-[var(--card)]"
          }`}
        >
          <div className="w-[26px] h-[26px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.92L12 10v2" />
              <circle cx="12" cy="16" r="2" />
              <path d="M12 18v2" />
              <path d="M8 22h8" />
              <path d="M7 6a5 5 0 0 0 0 4" />
              <path d="M17 6a5 5 0 0 1 0 4" />
            </svg>
          </div>
          <span className="text-[20px]">AI Gen</span>
          {aiMode && (
            <span className="ml-auto w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          )}
        </button>

        {/* All feed */}
        <button
          onClick={() => { if (aiMode && onAiModeToggle) onAiModeToggle(); onCategoryChange(null); }}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-full transition-colors text-left ${
            !aiMode && activeCategory === null
              ? "font-bold text-[var(--foreground)] bg-[var(--card)]"
              : "text-[var(--foreground)] hover:bg-[var(--card)]"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[26px] h-[26px]"
          >
            <path d="M12 9c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm0 6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-13.304L.622 8.807l1.06 1.696L12 3.696l10.318 6.807 1.06-1.696L12 1.696zM12 16.984l-7.26-4.793-1.06 1.696L12 20.696l8.318-6.807-1.06-1.696L12 16.984z" />
          </svg>
          <span className="text-[20px]">All</span>
        </button>

        {/* Category nav items */}
        {categories.map(({ category, count }) => {
          const meta = CATEGORY_META[category];
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => { if (aiMode && onAiModeToggle) onAiModeToggle(); onCategoryChange(isActive ? null : category); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-full transition-colors text-left ${
                isActive
                  ? "font-bold text-[var(--foreground)] bg-[var(--card)]"
                  : "text-[var(--foreground)] hover:bg-[var(--card)]"
              }`}
            >
              <div
                className="w-[26px] h-[26px] flex items-center justify-center"
                style={{ color: isActive ? meta.color : "currentColor" }}
              >
                <CategoryIcon category={category} />
              </div>
              <span className="text-[20px]">{meta.label}</span>
              <span className="text-[var(--muted)] text-sm ml-auto">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="px-3 py-2 text-[13px] text-[var(--muted)]">
        Scroll to grow in faith. Tap to expand.
      </div>
    </nav>
  );
}
