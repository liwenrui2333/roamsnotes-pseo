# Type: C emotional-intent tarot page

The reader arrives with a high-emotion search like "{{RAW_QUERY}}". The page should satisfy the search, then move the reader from fate-seeking to a healthier, answerable question.

## Page inputs from reframe-map.yaml

- raw_query: {{RAW_QUERY}}
- reframed_question: {{REFRAMED}}
- why: {{WHY}}
- red_flag: {{RED_FLAG}}
- spread_hint: {{SPREAD_HINT}}

## Selected section skeleton

Use exactly these headings, in this exact order, as `sections[].heading`:

{{SKELETON}}

Do not add, remove, rename, or reorder same-level section headings.

## Writing requirements

1. Open with empathy and no scolding. Acknowledge that wanting to know "{{RAW_QUERY}}" is understandable.
2. Make the reframe the core value: show how "{{RAW_QUERY}}" becomes "{{REFRAMED}}", and explain {{WHY}}.
3. Name the red flag naturally: {{RED_FLAG}}. Help the reader avoid sellers who monetize anxiety.
4. Include one worked example using the reframed question and, when useful, {{SPREAD_HINT}}.
5. Include a small "reality check" data point labeled as general research, not a prediction.
6. Keep agency with the reader. Tarot can support reflection; it cannot decide another person's choices or future.
7. Keep `primary_cta` and the final section naturally pointed at {{TOOL_PATH}}. Keep {{MONEY_PATH}} only in `related`.

## Fixed fields

- slug: {{SLUG}}
- type: info
- category: "Tarot"
- title must include the target keyword: {{TARGET_KW}}
- cta_url: {{TOOL_PATH}}
- related: {{RELATED}}
- last_updated: {{DATE}}
- budget: "N/A (free reflection-first guide)"
- delivery: "Self-guided; pairs with a written reading if you want one"
- risk_level: "Low"
- hero: set `{ src: "{{HERO_SRC}}", alt: "{{HERO_ALT}}", caption: <one sentence tied to the theme> }`; do not change src
- tldr: write 30-50 words. Start with the conclusion that this page helps turn a fate-style question into an action-oriented question.
- structure: include a comparison of original question vs reframed question, using a table or bold labels.
