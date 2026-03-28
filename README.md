# infomaxxing

Doomscroll your way to knowledge. An infinite-scroll feed of core engineering concepts, styled like X/Twitter.

Replace mindless scrolling with learning. Security, networking, algorithms, design patterns, systems, cryptography, and more - one concept at a time.

![infomaxxing screenshot](public/screenshot.png)

## Run it

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

That's it. No environment variables, no database, no API keys.

## What you get

- Dark-themed X/Twitter-style infinite scroll feed
- 60+ curated engineering concepts across 14 categories
- Tap any card to expand: full explanation, examples, "why it matters", related terms
- Category filtering via sidebar
- Mobile responsive
- Zero external dependencies beyond Next.js

## Add concepts

Edit `src/data/concepts.ts`. Each concept follows this shape:

```ts
{
  id: "your-concept",
  term: "Your Concept",
  category: "security", // see Category type for options
  tags: ["tag1", "tag2"],
  oneLiner: "One sentence hook.",
  body: "Full explanation.",
  example: "Optional concrete example.",
  whyItMatters: "Why an engineer should care.",
  relatedTerms: ["term1", "term2"]
}
```

Categories: `security`, `networking`, `algorithms`, `data-structures`, `design-patterns`, `systems`, `web`, `databases`, `devops`, `cryptography`, `architecture`, `programming`, `performance`, `concurrency`.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Bun

## License

MIT
