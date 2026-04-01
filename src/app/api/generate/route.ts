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

const SYSTEM_PROMPT = `Generate exactly 5 unique Catholic teaching threads as a JSON array. Be concise and direct. Output ONLY raw JSON — no markdown, no code fences, no explanation, no preamble.

Each object: {"id":"kebab-case","term":"Name","category":"ONE_OF: ${CATEGORIES.join(",")}","tags":["a","b"],"oneLiner":"Under 140 chars","body":"1 paragraph","example":"1 paragraph","whyItMatters":"1-2 sentences","relatedTerms":["a","b"]}

Diverse categories. Interesting topics.`;

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
            content: `Batch #${batchIndex + 1}. Generate 5 Catholic threads now. Raw JSON array only.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: "AI API failed", details: errText.slice(0, 200) }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a TransformStream that forwards SSE chunks while collecting content
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullContent += delta;
              // Send a keep-alive/progress ping
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ partial: true, length: fullContent.length })}\n\n`));
            }
          } catch {
            // skip
          }
        }
      },
      flush(controller) {
        // Final: parse and send the complete result
        try {
          let parsed;
          try {
            parsed = JSON.parse(fullContent);
          } catch {
            const match = fullContent.match(/\[[\s\S]*\]/);
            if (match) {
              parsed = JSON.parse(match[0]);
            } else {
              throw new Error("Could not parse");
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

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, threads })}\n\n`));
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: "Parse failed", raw: fullContent.slice(0, 200) })}\n\n`));
        }
      },
    });

    // Pipe the upstream response through our transform
    response.body.pipeTo(transformStream.writable);

    return new Response(transformStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
