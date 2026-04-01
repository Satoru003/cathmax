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
  const encoder = new TextEncoder();
  const body = await req.json().catch(() => ({}));
  const batchIndex = body.batchIndex || 0;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial keepalive immediately
      controller.enqueue(encoder.encode(`: keepalive\n\n`));

      // Set up periodic keepalive pings
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 3000);

      try {
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI API failed: " + errText.slice(0, 100) })}\n\n`));
          clearInterval(keepalive);
          controller.close();
          return;
        }

        // Read upstream stream and collect content
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
              // skip
            }
          }
          // Send progress ping with each upstream chunk
          controller.enqueue(encoder.encode(`: progress ${fullContent.length}\n\n`));
        }

        clearInterval(keepalive);

        if (!fullContent.trim()) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Empty AI response" })}\n\n`));
          controller.close();
          return;
        }

        // Parse
        let parsed;
        try {
          parsed = JSON.parse(fullContent);
        } catch {
          const match = fullContent.match(/\[[\s\S]*\]/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Parse failed", raw: fullContent.slice(0, 200) })}\n\n`));
            controller.close();
            return;
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

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ threads })}\n\n`));
        controller.close();
      } catch (error) {
        clearInterval(keepalive);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
