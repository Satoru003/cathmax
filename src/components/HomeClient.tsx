"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Category, Concept } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { ConceptSummary, getConceptById, searchConcepts } from "@/lib/concepts";
import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";
import { ConceptDetail } from "@/components/ConceptDetail";
import { AchievementToast } from "@/components/AchievementToast";
import { useProgress } from "@/lib/useProgress";

interface HomeClientProps {
  categories: { category: Category; count: number }[];
  totalCount: number;
  suggestionPool: ConceptSummary[];
  initialSuggestions: ConceptSummary[];
}

export function HomeClient({
  categories,
  totalCount,
  suggestionPool,
  initialSuggestions,
}: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef(0);
  const progress = useProgress();

  // Load post from ?post= query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");
    if (postId) {
      const item = getConceptById(postId);
      if (item) {
        setSelectedConcept(item);
        progress.markSeen(item.id, item.term, item.category);
      }
    }
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const id = p.get("post");
      if (!id) {
        setSelectedConcept(null);
      } else {
        const found = getConceptById(id);
        if (found) setSelectedConcept(found);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectConcept = useCallback((concept: Concept) => {
    if (scrollRef.current) savedScrollRef.current = scrollRef.current.scrollTop;
    setSelectedConcept(concept);
    progress.markSeen(concept.id, concept.term, concept.category);
    window.history.pushState(null, "", `?post=${encodeURIComponent(concept.id)}`);
  }, [progress]);

  const handleBack = useCallback(() => {
    setSelectedConcept(null);
    window.history.pushState(null, "", window.location.pathname);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = savedScrollRef.current;
    });
  }, []);

  const handleSelectRelated = useCallback((term: string) => {
    const items = searchConcepts(term);
    if (items.length > 0) {
      const match = items.find(
        (c: Concept) => c.term.toLowerCase() === term.toLowerCase()
      ) || items[0];
      setSelectedConcept(match);
      progress.markSeen(match.id, match.term, match.category);
      window.history.pushState(null, "", `?post=${encodeURIComponent(match.id)}`);
    }
  }, [progress]);

  return (
    <div className="flex justify-center h-dvh overflow-hidden">
      {/* Left sidebar - X style nav */}
      <div className="w-[275px] shrink-0 border-r border-[var(--border)] hidden lg:block overflow-y-auto overscroll-contain" style={{ touchAction: "pan-y" }}>
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />
      </div>

      {/* Main feed column */}
      <main className="w-full max-w-[600px] border-r border-[var(--border)] flex flex-col min-h-0">
        {/* Detail view - overlays feed but feed stays mounted */}
        {selectedConcept && (
          <ConceptDetail concept={selectedConcept} onBack={handleBack} onSelectRelated={handleSelectRelated} />
        )}

        {/* Feed - always mounted, hidden when viewing a post */}
        <div className={`flex flex-col min-h-0 flex-1 ${selectedConcept ? "hidden" : ""}`}>
          {/* Fixed header above scroll area */}
          <div className="shrink-0 bg-black">
            {/* Mobile: X Tabs style header */}
            <div className="lg:hidden">
              {/* Row 1: logo + progress */}
              <div className="px-4 py-2.5 flex items-center justify-between">
                <h1 className="text-[18px] font-bold text-white tracking-tight uppercase">catholic<span className="text-[#ff1744]">maxxx</span>ing</h1>
                <button
                  onClick={() => setMobileStatsOpen(!mobileStatsOpen)}
                  className="flex items-center gap-1.5 text-white hover:text-[var(--accent)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  {progress.seenCount > 0 && (
                    <span className="text-xs font-mono bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded-full">
                      {progress.seenCount}
                    </span>
                  )}
                </button>
              </div>
              {/* Row 2: X-style underlined tabs - scrollable */}
              <div className="flex overflow-x-auto border-b border-[var(--border)]" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 px-4 py-3 text-[14px] transition-colors relative ${
                    activeCategory === null
                      ? "text-[var(--foreground)] font-bold"
                      : "text-[var(--muted)] font-medium"
                  }`}
                >
                  For You
                  {activeCategory === null && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[var(--accent)] rounded-full" />
                  )}
                </button>
                {categories.map(({ category }) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    className={`shrink-0 px-4 py-3 text-[14px] transition-colors relative whitespace-nowrap ${
                      activeCategory === category
                        ? "text-[var(--foreground)] font-bold"
                        : "text-[var(--muted)] font-medium"
                    }`}
                  >
                    {CATEGORY_META[category].label}
                    {activeCategory === category && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[var(--accent)] rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Feed label - desktop only */}
            <h2 className="px-4 py-3 text-[20px] font-bold text-[var(--foreground)] hidden lg:block border-b border-[var(--border)]">
              {searchQuery?.trim()
                ? "Search"
                : activeCategory
                  ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace("-", " ")}`
                  : "For You"}
            </h2>
          </div>

          {/* Scrollable feed area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain min-h-0" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            <Feed
              category={activeCategory}
              searchQuery={searchQuery}
              seenIds={progress.seenIds}
              onConceptSelect={handleSelectConcept}
            />
            {/* Mobile bottom spacer so content isn't hidden behind sticky banner */}
            <div className="h-12 lg:hidden" />
          </div>
        </div>
      </main>

      {/* Right sidebar */}
      <div className="w-[275px] shrink-0 pl-4 pr-4 hidden xl:block overflow-y-auto overscroll-contain" style={{ touchAction: "pan-y" }}>
        <RightSidebar
          totalCount={totalCount}
          suggestionPool={suggestionPool}
          initialSuggestions={initialSuggestions}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          seenCount={progress.seenCount}
          milestones={progress.milestones}
          celebratedMilestones={progress.celebratedMilestones}
        />
      </div>

      {/* Achievement toast */}
      {progress.pendingMilestone && (
        <AchievementToast
          milestone={progress.pendingMilestone}
          onDismiss={progress.dismissMilestone}
        />
      )}

      {/* Mobile stats dropdown */}
      {mobileStatsOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileStatsOpen(false)}
          />
          <div className="absolute top-14 right-3 left-3 bg-black border border-[var(--border)] rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-bold text-[var(--foreground)]">
                Your Progress
              </h3>
              <button
                onClick={() => setMobileStatsOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.3 5.71a1 1 0 00-1.42 0L12 10.59 7.12 5.71a1 1 0 00-1.42 1.42L10.59 12l-4.89 4.88a1 1 0 001.42 1.42L12 13.41l4.88 4.89a1 1 0 001.42-1.42L13.41 12l4.89-4.88a1 1 0 000-1.41z" />
                </svg>
              </button>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[28px] font-bold text-[var(--foreground)]">{progress.seenCount}</span>
              <span className="text-[13px] text-[var(--muted)]">/ {totalCount} concepts</span>
            </div>
            <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((progress.seenCount / totalCount) * 100, 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {progress.milestones.map((m) => {
                const achieved = progress.celebratedMilestones.includes(m);
                return (
                  <span
                    key={m}
                    className={`text-[12px] px-2.5 py-1 rounded-full font-mono transition-colors ${
                      achieved
                        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "bg-[var(--border)]/50 text-[var(--muted)]"
                    }`}
                  >
                    {achieved && "\u2713 "}{m}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
