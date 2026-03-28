"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Concept, Category } from "@/lib/types";
import { ConceptCard } from "./ConceptCard";

interface FeedProps {
  category: Category | null;
}

export function Feed({ category }: FeedProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        cursor: cursor.toString(),
        limit: "10",
      });
      if (category) params.set("category", category);
      const res = await fetch(`/api/concepts?${params}`);
      const data = await res.json();
      setConcepts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, category, loading]);

  // Reset when category changes
  useEffect(() => {
    setConcepts([]);
    setCursor(0);
  }, [category]);

  // Initial load + category change
  useEffect(() => {
    if (concepts.length === 0 && !loading) {
      const load = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            cursor: "0",
            limit: "15",
          });
          if (category) params.set("category", category);
          const res = await fetch(`/api/concepts?${params}`);
          const data = await res.json();
          setConcepts(data.items);
          setCursor(data.nextCursor);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [concepts.length, category, loading]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && concepts.length > 0) {
          fetchMore();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );

    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [fetchMore, loading, concepts.length]);

  return (
    <div className="feed-container">
      {/* Tab header - X style */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/70 border-b border-[var(--border)]">
        <h2 className="px-4 py-3 text-[20px] font-bold text-[var(--foreground)]">
          {category
            ? `${category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}`
            : "For You"}
        </h2>
      </div>

      {/* Cards */}
      {concepts.map((concept, idx) => (
        <ConceptCard key={`${concept.id}-${idx}`} concept={concept} />
      ))}

      {/* Loading trigger */}
      <div ref={loaderRef} className="py-8 flex justify-center">
        {loading && (
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
