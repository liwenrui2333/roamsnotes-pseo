# Type: Evergreen Explainer
The reader is searching for the meaning of an astrology event in a relationship context. This page should explain the theme clearly, reduce panic, and translate the event into reflection rather than prediction.

## Hard constraints

1. Use only broad, real, calculable astrology themes. For Mercury retrograde, you may discuss review, miscommunication, delays, revisions, old conversations resurfacing, and the value of checking assumptions.
2. Do not invent dates, signs, houses, aspects, or transits that were not provided.
3. Do not predict fate, reunion, breakup, or timing.
4. Do not say or imply "your ex will come back", "this guarantees closure", or any other outcome claim.
5. The page must stay grounded: astrology is context and rhythm, not proof or destiny.

## Real sky data (use these exact dates — verified from ephemeris)

{{SKY_DATA}}

When the sky data includes a retrograde window, you MUST state the exact dates and sign in the direct-answer opener and use them as a concrete anchor throughout the page. Do not invent additional astrological details beyond what is provided.

## Writing rules

1. Start with a direct answer in plain English.
2. Use 3-5 scannable subheads that explain what the event can highlight in love or breakup situations.
3. Include one "reality check" section that separates common mythology from what the symbol can actually be used for.
4. Include a short section titled "When to get a real reading" for cases where someone is stuck in loops, rereading mixed signals, or needs help framing the right question.
5. End with a soft CTA to {{MONEY_CONTEXT}} at {{MONEY_PATH}} and an internal nudge to {{TOOL_PATH}}.
6. Keep the tone measured, warm, and slightly skeptical.

## Required output

Return exactly one JSON object with ASCII double quotes and no markdown fence.

- slug: "{{SLUG}}"
- type: "info"
- category: "Astrology"
- title: use title case and include the keyword "{{TARGET_KW}}" naturally
- h1: a clean headline that answers the keyword directly, using title case
- description: 50-60 words, concrete and calm
- intent: one sentence on what the reader wants to understand
- audience: one sentence describing the likely reader
- primary_cta: a soft CTA pointing to {{MONEY_CONTEXT}}
- cta_url: "{{MONEY_PATH}}"
- related: {{RELATED}}
- last_updated: "{{DATE}}"
- budget: "Free explainer; a paid reading is optional if you want context"
- delivery: "Read in 4 min; designed for reflection, not prediction"
- risk_level: "Low"
- hero: { "src": "{{HERO_SRC}}", "alt": "{{HERO_ALT}}", "caption": "Use the symbol as a prompt to review, not a verdict about your future." }
- tldr: 30-50 words that answer fast
- sections: 5-6 sections, each an object with "heading" and "body"
- faq: 3 objects with "q" and "a"

## Section structure

The sections must include:

1. A direct-answer opener.
2. 3-4 explanatory sections with subheads about relationship themes, communication patterns, review loops, boundaries, or breakups.
3. One section titled "Reality check".
4. One section titled "When to get a real reading".
5. One closing section that links naturally to {{TOOL_PATH}} and {{MONEY_CONTEXT}} at {{MONEY_PATH}}.

## Formatting constraints

- Every section body must use bullets, short paragraphs, or a table. No long unbroken text.
- Write all reader-facing copy in English only, using ASCII punctuation and characters.
- Include at least one concrete anchor such as a checklist, comparison, or short decision lens.
- Stay evergreen unless a real date is provided in the input.
- No fear language, no doom framing, no magical certainty.
- Do not use the phrase "reconciliation reading" for {{MONEY_PATH}} unless {{MONEY_CONTEXT}} explicitly says that. For /go/reconciliation/, prefer "a personal astrology reading on the relationship dynamics."
- Vary the skeptical boundary language. Do not repeat "not a verdict" or "not a guarantee" in every section.
- Do not include the exact phrases "medical advice", "legal advice", "financial certainty", "guaranteed result", "remove curse", or "curse removal"; they fail the local quality gate.
