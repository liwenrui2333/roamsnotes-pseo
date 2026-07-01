# Type: D2 zodiac compatibility

The reader is searching for "{{TARGET_KW}}". Most pages in this SERP repeat flat Sun-sign stereotypes. This page must reason from the real inputs below: element, modality, ruler, and keywords.

## Page inputs from sign-traits.yaml

- A: {{SIGN_A}} element={{A_ELEMENT}} modality={{A_MODALITY}} ruler={{A_RULER}} keywords={{A_KEYWORDS}}
- B: {{SIGN_B}} element={{B_ELEMENT}} modality={{B_MODALITY}} ruler={{B_RULER}} keywords={{B_KEYWORDS}}
- element_relation: {{ELEMENT_RELATION}}
- modality_relation: {{MODALITY_RELATION}}

## Selected section skeleton

Use exactly these headings, in this exact order, as `sections[].heading`:

{{SKELETON}}

Do not add, remove, rename, or reorder same-level section headings. Put the compatibility table in the first section.

## Scoring rule

The scores have already been calculated and injected by the system:
Love={{SCORE_LOVE}}% Communication={{SCORE_COMMUNICATION}}% Passion={{SCORE_PASSION}}% Trust={{SCORE_TRUST}}% Long-term={{SCORE_LONGTERM}}%.

For each score, write only one short reason that cites the real element or modality relationship. Do not change the numbers. After the table, copy this exact line as the public method note:

{{SCORE_BASIS}}

## Writing requirements

1. Explain attraction and friction from {{ELEMENT_RELATION}} and {{MODALITY_RELATION}}, not from generic sign stereotypes.
2. Stay bidirectional: show how {{SIGN_A}} may experience {{SIGN_B}} and how {{SIGN_B}} may experience {{SIGN_A}}.
3. Include a `Strengths` bullet group and a `Challenges` bullet group inside the body of a section. Do not use "Strengths and challenges" as a heading.
4. Give two concrete behaviors that fit the element or modality gap, such as translating "I need space" into a specific check-in rhythm.
5. Keep the boundary honest: Sun-sign compatibility is one layer, not a verdict. A real synastry reading needs both birth charts.
6. Keep `primary_cta` and the final section naturally pointed at {{TOOL_PATH}}. Keep {{MONEY_PATH}} only in `related`.

## Fixed fields

- slug: {{SLUG}}
- type: info
- category: "Astrology"
- title must include the target keyword: {{TARGET_KW}}
- cta_url: {{TOOL_PATH}}
- related: {{RELATED}}
- last_updated: {{DATE}}
- budget: "A full synastry reading runs $25-$120"
- delivery: "Sun-sign overview here; full reading needs both birth charts"
- risk_level: "Low"
- hero: set `{ src: "{{HERO_SRC}}", alt: "{{HERO_ALT}}", caption: <one sentence> }`; do not change src
- tldr: write 30-50 words. Start with the practical conclusion: overall fit, strongest point, and likely friction.
- structure: first section must include a markdown score table with exact rows Love / Communication / Passion / Trust / Long-term, exact injected percentages, and one reason per row.
