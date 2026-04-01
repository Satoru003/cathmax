"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Concept } from "@/lib/types";
import { ConceptCard } from "./ConceptCard";

interface AiFeedProps {
  onConceptSelect?: (concept: Concept) => void;
}

export function AiFeed({ onConceptSelect }: AiFeedProps) {
  const [threads, setThreads] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const batchRef = useRef(0);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current) return;
    setLoading(true);
    loadingRef.current = true;
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchIndex: batchRef.current }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Generation failed (${res.status}): ${text.slice(0, 100)}`);
      }

      // Handle SSE response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith(":")) continue; // skip comments/keepalives
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.threads) {
              setThreads((prev) => [...prev, ...data.threads]);
              batchRef.current += 1;
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // skip partial JSON
            throw e;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (threads.length === 0 && !loading) {
      fetchMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && threads.length > 0) {
          fetchMore();
        }
      },
      { threshold: 0.1, rootMargin: "600px" }
    );

    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [fetchMore, threads.length]);

  return (
    <div className="feed-container">
      {/* AI badge header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
        <span className="text-[13px] text-[var(--muted)]">
          AI is generating Catholic threads in real-time
        </span>
        <span className="text-[13px] text-[var(--muted)] ml-auto">
          {threads.length} generated
        </span>
      </div>

      {/* Cards */}
      {threads.map((concept, idx) => (
        <ConceptCard
          key={`ai-${concept.id}-${idx}`}
          concept={concept}
          onSelect={onConceptSelect}
        />
      ))}

      {/* Error state */}
      {error && (
        <div className="py-8 text-center">
          <p className="text-[#f4212e] text-[15px] mb-3">{error}</p>
          <button
            onClick={fetchMore}
            className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-[14px] font-bold hover:bg-[var(--accent)]/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading trigger */}
      <div ref={loaderRef} className="py-8 flex flex-col items-center gap-3">
        {loading && (
          <>
            <div className="w-6 h-6 border-2 border-[#00e676] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-[var(--muted)]">
              Generating {threads.length === 0 ? "first" : "more"} threads...
            </span>
          </>
        )}
      </div>
    </div>
  );
}
