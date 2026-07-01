# Type: Question List
The reader is searching for better tarot questions to ask about a specific emotional situation. This page should give an immediate, usable answer, then organize strong example questions into scannable groups. The tone is calm, reflective, and practical. Do not frame tarot as fate, certainty, or a shortcut around real communication.

## Core writing rules

1. Start with a direct answer: yes, this is a useful thing to ask tarot about, but the quality of the question matters more than sounding mystical.
2. Group the example questions by sub-intent so the page is easy to scan. Good buckets include clarity, self-awareness, patterns, boundaries, next steps, or closure, depending on the keyword.
3. Keep every example question focused on the reader's perspective, choices, feelings, or patterns. Do not write questions that assume control over another person's mind, future, or behavior.
4. Include one short "reality check" moment that says tarot can help you reflect, but it cannot guarantee an outcome or tell you what another person will choose.
5. Include a short section titled "When to get a real reading" that explains when a human reader may help: emotional complexity, repeated loops, trouble narrowing the real question, or wanting a structured interpretation.
6. Softly direct readers to {{TOOL_PATH}} as the practical next step for generating or refining their question set.
7. If {{MONEY_PATH}} is mentioned, describe it as {{MONEY_CONTEXT}}. Do not call /go/reconciliation/ a tarot reading or a reconciliation service.
8. Keep the voice warm but skeptical. Reflection first, prediction never.

## Required output

Return exactly one JSON object with ASCII double quotes and no markdown fence.

- slug: "{{SLUG}}"
- type: "info"
- category: "Tarot"
- title: use title case and include the keyword "{{TARGET_KW}}" naturally
- h1: a clean, natural headline matching the title intent. If slug is "yes-or-no-tarot-questions", use "The Best Yes or No Tarot Questions to Ask"
- description: 50-60 words, concrete, not fluffy
- intent: one sentence on why this reader searched this phrase
- audience: one sentence describing the likely reader
- primary_cta: a soft CTA that points to the question generator
- cta_url: "{{TOOL_PATH}}"
- related: {{RELATED}}
- last_updated: "{{DATE}}"
- budget: "Free question list; a written reading is optional if you want outside perspective"
- delivery: "Read in 4 min; use with a self-reading or reader intake"
- risk_level: "Low"
- hero: { "src": "{{HERO_SRC}}", "alt": "{{HERO_ALT}}", "caption": "A reflective prompt can reveal more than a dramatic one." }
- tldr: 30-50 words that answer fast
- sections: 5-6 sections, each an object with "heading" and "body"
- faq: 3 objects with "q" and "a"

## Section structure

The sections must include:

1. A direct-answer opener that explains what makes a good question here.
2. 2-3 sections of grouped example questions with clear labels and scannable bullets.
3. One section that explains common mistakes or unhelpful question patterns.
4. One section titled "When to get a real reading".
5. One closing section that points naturally to {{TOOL_PATH}} and, where relevant, mentions {{MONEY_CONTEXT}} at {{MONEY_PATH}} as an optional next step.

## Formatting constraints

- Every section body must be structured with bullets, short paragraphs, or a table. No wall-of-text blocks.
- Write all reader-facing copy in English only, using ASCII punctuation and characters.
- Include at least one concrete anchor such as a number, time frame, or comparison.
- Keep examples specific and emotionally believable.
- Do not mention astrology unless the keyword clearly needs it.
- Do not promise reunion, certainty, timing, or hidden truth.
- Use "outside perspective" or "relationship dynamics" language for paid CTAs. Avoid phrases like "reconciliation reading" unless the actual service is explicitly a reconciliation tarot reading.
- Do not include the exact phrases "medical advice", "legal advice", "financial certainty", "guaranteed result", "remove curse", or "curse removal"; they fail the local quality gate.
