"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Concept, Category } from "@/lib/types";
import { ConceptCard } from "./ConceptCard";

const CATEGORIES: Category[] = [
  "saints", "sacraments", "scripture", "prayers", "doctrine",
  "morality", "church-history", "mary", "liturgy", "virtues",
  "apologetics", "social-teaching", "tradition", "devotions", "mysticism",
];

const API_URL = "https://opencode.ai/zen/v1/chat/completions";
const API_KEY = "sk-IGS3hTOkhX9Uw6GFuk5yoQPWLUI2EjrGBLU2lTwZw83IoccHA6dJ1mFovJrh02UH";
const MODEL = "qwen3.6-plus-free";

const SYSTEM_PROMPT = `You are a Catholic theology expert. Generate exactly 5 unique Catholic teaching threads as a JSON array. Be concise. Do NOT include any thinking, reasoning, or explanation — output ONLY the raw JSON array.

Each object must have these fields:
- "id": kebab-case string (e.g., "ai-divine-mercy")
- "term": concept name
- "category": one of: ${CATEGORIES.join(", ")}
- "tags": array of 2-3 lowercase tags
- "oneLiner": catchy one-line summary (under 140 chars)
- "body": 1-2 paragraph explanation
- "example": brief real-world example (1 paragraph)
- "whyItMatters": brief relevance (1-2 sentences)
- "relatedTerms": array of 2-3 related concept names

Use diverse categories. Output ONLY a valid JSON array, nothing else.`;

function parseAiResponse(content: string): Concept[] {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }
  }

  return (Array.isArray(parsed) ? parsed : [parsed]).map(
    (item: Record<string, unknown>, i: number) => ({
      id: (item.id as string) || `ai-gen-${Date.now()}-${i}`,
      term: (item.term as string) || "Catholic Teaching",
      category: (CATEGORIES.includes(item.category as Category)
        ? item.category
        : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]) as Category,
      tags: Array.isArray(item.tags) ? item.tags : ["catholic", "faith"],
      oneLiner: (item.oneLiner as string) || (item.one_liner as string) || "A beautiful Catholic teaching.",
      body: (item.body as string) || "",
      example: (item.example as string) || "",
      whyItMatters: (item.whyItMatters as string) || (item.why_it_matters as string) || "",
      relatedTerms: Array.isArray(item.relatedTerms)
        ? item.relatedTerms
        : Array.isArray(item.related_terms)
          ? item.related_terms
          : [],
    })
  );
}

interface AiFeedProps {
  onConceptSelect?: (concept: Concept) => void;
}

export function AiFeed({ onConceptSelect }: AiFeedProps) {
  const [threads, setThreads] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const batchRef = useRef(0);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current) return;
    setLoading(true);
    loadingRef.current = true;
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Generate batch #${batchRef.current + 1} of 5 Catholic threads. Different topics each time. JSON array only, no thinking.`,
            },
          ],
          temperature: 0.9,
          max_tokens: 3000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API error (${res.status}): ${errText.slice(0, 100)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const newThreads = parseAiResponse(content);

      setThreads((prev) => [...prev, ...newThreads]);
      batchRef.current += 1;
      setBatchIndex((prev) => prev + 1);
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
