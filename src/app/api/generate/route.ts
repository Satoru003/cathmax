import { NextRequest } from "next/server";

export const runtime = "edge";

const API_KEY = process.env.OPENCODE_API_KEY || "sk-IGS3hTOkhX9Uw6GFuk5yoQPWLUI2EjrGBLU2lTwZw83IoccHA6dJ1mFovJrh02UH";
const BASE_URL = "https://opencode.ai/zen/v1/chat/completions";
const MODEL = "mimo-v2-flash-free";

const CATEGORIES = [
  "saints", "sacraments", "scripture", "prayers", "doctrine",
  "morality", "church-history", "mary", "liturgy", "virtues",
  "apologetics", "social-teaching", "tradition", "devotions", "mysticism",
];

const SYSTEM_PROMPT = `Generate exactly 5 unique Catholic teaching threads as a JSON array. Be concise. Output ONLY raw JSON — no markdown, no explanation.

Each object: {"id":"kebab-case","term":"Name","category":"ONE_OF: ${CATEGORIES.join(",")}","tags":["a","b"],"oneLiner":"Under 140 chars","body":"2-3 sentences","example":"1-2 sentences","whyItMatters":"1 sentence","relatedTerms":["a","b"]}

Diverse categories. Interesting, varied topics each time.`;

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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Batch #${batchIndex + 1}. Generate 5 unique Catholic threads on different topics. JSON array only.`,
          },
        ],
        temperature: 0.95,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        { error: "AI generation failed", details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    // Parse JSON from the response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1].trim());
        } else {
          return Response.json(
            { error: "Could not parse AI response", raw: content.slice(0, 200) },
            { status: 500 }
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
        tags: Array.isArray(item.tags) ? item.tags : ["catholic"],
        oneLiner: (item.oneLiner as string) || (item.one_liner as string) || "A Catholic teaching.",
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

    return Response.json({ threads });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate", details: String(error) },
      { status: 500 }
    );
  }
}
