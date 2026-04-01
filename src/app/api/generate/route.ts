import { NextRequest } from "next/server";

export const runtime = "edge";

const API_KEY = process.env.OPENCODE_API_KEY || "sk-IGS3hTOkhX9Uw6GFuk5yoQPWLUI2EjrGBLU2lTwZw83IoccHA6dJ1mFovJrh02UH";
const BASE_URL = "https://opencode.ai/zen/v1/chat/completions";
const MODEL = "nemotron-3-super-free";

const CATEGORIES = [
  "saints", "sacraments", "scripture", "prayers", "doctrine",
  "morality", "church-history", "mary", "liturgy", "virtues",
  "apologetics", "social-teaching", "tradition", "devotions", "mysticism",
];

const SYSTEM_PROMPT = `Generate exactly 5 unique Catholic teaching threads as a JSON array. Be concise. Output ONLY raw JSON — no markdown fences, no explanation, no preamble.

Each object: {"id":"kebab-case","term":"Name","category":"ONE_OF: ${CATEGORIES.join(",")}","tags":["a","b"],"oneLiner":"Under 140 chars","body":"1 paragraph","example":"1 paragraph","whyItMatters":"1-2 sentences","relatedTerms":["a","b"]}

Diverse categories.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchIndex = body.batchIndex || 0;

    // Use streaming to avoid edge timeout, collect full response
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
            content: `Batch #${batchIndex + 1}. 5 Catholic threads. Raw JSON array only.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = response.body ? await response.text() : "No body";
      return Response.json(
        { error: "AI API failed", details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    // Read stream and collect content
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          fullContent += delta;
        } catch {
          // skip unparseable chunks
        }
      }
    }

    if (!fullContent.trim()) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    // Parse the collected content
    let parsed;
    try {
      parsed = JSON.parse(fullContent);
    } catch {
      const match = fullContent.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return Response.json(
          { error: "Could not parse AI response", raw: fullContent.slice(0, 300) },
          { status: 500 }
        );
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
      { error: "Failed to generate threads", details: String(error) },
      { status: 500 }
    );
  }
}
