import { NextRequest } from "next/server";

export const maxDuration = 60;
export const runtime = "edge";

// Server-only: this key is never exposed to the client bundle
const API_KEY = process.env.OPENCODE_API_KEY || "sk-IGS3hTOkhX9Uw6GFuk5yoQPWLUI2EjrGBLU2lTwZw83IoccHA6dJ1mFovJrh02UH";
const BASE_URL = "https://opencode.ai/zen/v1/chat/completions";
const MODEL = "qwen3.6-plus-free";

const CATEGORIES = [
  "saints", "sacraments", "scripture", "prayers", "doctrine",
  "morality", "church-history", "mary", "liturgy", "virtues",
  "apologetics", "social-teaching", "tradition", "devotions", "mysticism",
];

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchIndex = body.batchIndex || 0;

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate batch #${batchIndex + 1} of 5 Catholic threads. Different topics each time. JSON array only, no thinking.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response back, collecting the full content
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "No response body" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    let fullContent = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          fullContent += delta;
        } catch {
          // skip unparseable lines
        }
      }
    }

    // Parse the collected content
    let parsed;
    try {
      parsed = JSON.parse(fullContent);
    } catch {
      const jsonMatch = fullContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        const arrayMatch = fullContent.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsed = JSON.parse(arrayMatch[0]);
        } else {
          return new Response(
            JSON.stringify({ error: "Could not parse AI response", raw: fullContent.slice(0, 200) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    const threads = (Array.isArray(parsed) ? parsed : [parsed]).map(
      (item: Record<string, unknown>, i: number) => ({
        id: (item.id as string) || `ai-gen-${Date.now()}-${i}`,
        term: (item.term as string) || "Catholic Teaching",
        category: CATEGORIES.includes(item.category as string)
          ? item.category
          : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
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

    return new Response(
      JSON.stringify({ threads }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate threads" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
