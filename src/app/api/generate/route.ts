import { NextRequest, NextResponse } from "next/server";

// Server-only: this key is never exposed to the client bundle
const API_KEY = process.env.OPENCODE_API_KEY || "sk-IGS3hTOkhX9Uw6GFuk5yoQPWLUI2EjrGBLU2lTwZw83IoccHA6dJ1mFovJrh02UH";
const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen3.6-plus-preview:free";

const CATEGORIES = [
  "saints", "sacraments", "scripture", "prayers", "doctrine",
  "morality", "church-history", "mary", "liturgy", "virtues",
  "apologetics", "social-teaching", "tradition", "devotions", "mysticism",
];

const SYSTEM_PROMPT = `You are a Catholic theology expert generating educational content for a Catholic teaching platform called "catholicmaxxxing".

Generate exactly 5 unique Catholic teaching threads. Each thread should be engaging, educational, and faithful to Catholic doctrine.

Return ONLY valid JSON — an array of 5 objects. No markdown, no code fences, no explanation. Each object must have:
- "id": a unique kebab-case string (e.g., "ai-divine-mercy-devotion")
- "term": the concept name (e.g., "Divine Mercy")
- "category": one of: ${CATEGORIES.join(", ")}
- "tags": array of 2-4 relevant lowercase tags
- "oneLiner": a catchy one-line summary (tweet-length, under 200 chars)
- "body": a 2-3 paragraph explanation of the concept
- "example": a real-world example or historical anecdote (1-2 paragraphs)
- "whyItMatters": why this matters for Catholics today (1 paragraph)
- "relatedTerms": array of 2-3 related Catholic concept names

Use diverse categories. Make content interesting, accessible, and doctrinally sound. Vary between well-known and lesser-known topics. Each generation should cover different topics.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchIndex = body.batchIndex || 0;

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://cathmaxx.vercel.app",
        "X-Title": "catholicmaxxxing",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate batch #${batchIndex + 1} of 5 unique Catholic teaching threads. Pick different topics than typical — surprise me with interesting, lesser-known Catholic teachings, saints, devotions, and traditions. Return ONLY the JSON array, nothing else.`,
          },
        ],
        temperature: 1.0,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      return NextResponse.json(
        { error: "AI generation failed", details: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from the response - handle potential markdown fences
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding array in the response
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsed = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    // Validate and ensure proper structure
    const threads = (Array.isArray(parsed) ? parsed : [parsed]).map(
      (item: Record<string, unknown>, i: number) => ({
        id: (item.id as string) || `ai-gen-${Date.now()}-${i}`,
        term: (item.term as string) || "Catholic Teaching",
        category: CATEGORIES.includes(item.category as string)
          ? item.category
          : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        tags: Array.isArray(item.tags) ? item.tags : ["catholic", "faith"],
        oneLiner: (item.oneLiner as string) || (item.one_liner as string) || "A beautiful Catholic teaching worth exploring.",
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

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate threads" },
      { status: 500 }
    );
  }
}
