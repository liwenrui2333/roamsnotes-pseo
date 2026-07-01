# Type: B tarot spread tutorial

The reader wants to learn a specific spread: "{{TARGET_KW}}". This is a teaching page. It should help them use the spread, then gently route to a real reader only if they want outside interpretation.

## Page inputs from topics

- spread_name: {{SPREAD_NAME}}
- positions: {{POSITIONS}}
- best_for: {{BEST_FOR}}
- common_mistake: {{COMMON_MISTAKE}}

## Selected section skeleton

Use exactly these headings, in this exact order, as `sections[].heading`:

{{SKELETON}}

Do not add, remove, rename, or reorder same-level section headings.

## Writing requirements

1. Start with a clear one-sentence use case for {{SPREAD_NAME}} based on {{BEST_FOR}}.
2. Teach the positions from {{POSITIONS}} in order. This is the core value of the page; make it specific enough to follow with cards on the table.
3. Include one worked example using a real question and show how the positions map to it.
4. Include 3-4 named spread variants, such as past/present/future or situation/influence/guidance. Each variant needs a short position explanation and a step list.
5. Name the common mistake directly: {{COMMON_MISTAKE}}. Explain how to avoid it.
6. Keep the boundary honest: a spread structures reflection; it does not guarantee an outcome.
7. Keep `primary_cta` and the final section naturally pointed at {{TOOL_PATH}}. Keep {{MONEY_PATH}} only in `related`.

## Fixed fields

- slug: {{SLUG}}
- type: guide
- category: "Tarot"
- title must include the target keyword: {{TARGET_KW}}
- cta_url: {{TOOL_PATH}}
- related: {{RELATED}}
- last_updated: {{DATE}}
- budget: "Free to do yourself; a written reading runs $5-$35 if you want one"
- delivery: "Self-guided tutorial"
- risk_level: "Low"
- hero: set `{ src: "{{HERO_SRC}}", alt: "{{HERO_ALT}}", caption: <one sentence> }`; do not change src
- tldr: write 30-50 words. Start with what the spread is best for and how many positions it uses.
- structure: include the given spread plus 3-4 named variants; keep interpretation as its own meaningful section body even when the selected heading is not called "interpretation".
