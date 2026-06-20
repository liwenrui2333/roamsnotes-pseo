# Type: 天象事件 / Astro Event（event）

读者搜 "{{TARGET_KW}}"（如 full moon june 2026 / mercury retrograde july 2026）。这类是**事件词**——需求在事件临近时飙升，竞争比 evergreen 大词低得多。我们靠**真实日期 + 提前卡位 + 人格反思**抢首发，而不是事后跟风写空话。

**核心特色：这一页有一个真实、确定的日期锚（{{EVENT_DATE}}），围绕它做诚实的反思式解读，绝不预言"这天会发生什么"。**

## 本页独家输入（来自 event_calendar.yaml，真实计算/权威日期，已为你取好）

- 事件 event_name: {{EVENT_NAME}}
- 类型 kind: {{EVENT_KIND}}（full-moon=满月 / new-moon=新月 / retrograde=逆行 等）
- 确定日期 date: {{EVENT_DATE}}（{{MONTH}} {{YEAR}}）
- 目标词 target_kw: {{TARGET_KW}}

**硬约束**：你只能用上面这些事实。**不要**编造月亮所在星座、行星相位、具体吉时凶时、"这天你会……"的预言。满月/新月只能讲"适合什么内在工作"（满月=看清/完成/释放；新月=重置/起意）。

## 写作要求

1. **开头给确定日期**：直接说 {{EVENT_NAME}} 的确切日期 {{EVENT_DATE}}，具体可查、不玄乎。读者搜这个词就是想知道"什么时候 + 意味着什么"。
2. **翻译成反思，不是预言**：满月=看清与完成、注意浮上来的情绪；新月=安静重置、命名一个意图。讲它**邀请**你做的内在工作，明确是节律不是命运。
3. **一个 reality check**：月运周期约 29.5 天、满月只是地月日成一线的几何事实——标注为天文常识，破除"满月让人疯"的夸大。
4. **给今天/这天能用的小动作**：满月→盘点一件已完成的事 + 一次释放性反思；新月→写一句意图。可导向问题生成器工具做一次自检。
5. **诚实边界**：天象是背景节律，不决定你的具体选择；情绪重时这只是一个反思输入，不替代专业帮助。
6. **不跨期承诺**：不写"接下来一个月你的运势"，只就这一个事件。
7. 收在反思。软植入 `primary_cta` 自然导向 {{TOOL_PATH}}。

## 给定字段（严格输出一个 JSON 对象，ASCII 双引号，无 markdown 围栏）

- slug: "{{SLUG}}"　type: "info"　category: "Astrology"
- title: 含事件名与日期，如 "{{EVENT_NAME}}: Date and What It Means for Reflection"
- h1: 与 title 呼应，含 {{EVENT_NAME}}
- description: 50-60 词 meta，先给确定日期 {{EVENT_DATE}} 再说这页帮你做什么反思
- intent: 一句读者来意　audience: 一句目标读者
- primary_cta: 软性号召（导向问题生成器）　cta_url: "{{TOOL_PATH}}"
- related: {{RELATED}}（正好 3 个）
- last_updated: "{{DATE}}"
- budget: "N/A (free astro-event guide)"　delivery: "Read in 3 min; dated reference"　risk_level: "Low"
- hero: { "src": "{{HERO_SRC}}", "alt": "Tarot card evoking the {{EVENT_KIND}}", "caption": "<一句呼应本次事件的话>" }（不要改 src）
- tldr: 30-50 词速览，先给日期与结论（这次是什么事件 + 适合做什么内在工作）
- sections: **5-6 节**，{ "heading":..., "body":... }，body 必须有结构（列表/表格/多段，禁豆腐块）。至少含：①确切日期与天文上真实发生什么 ②这个事件邀请的反思 ③{{MONTH}} 季节性主题 ④reality check 数据点 ⑤这天能用的小动作。
- faq: 3 条 { "q":..., "a":... }，问真实长尾（如 "When is the {{EVENT_NAME}}?" / "What should I do during a {{EVENT_KIND}}?" / "Does the {{EVENT_KIND}} affect mood?"），答案只依据给定事实、诚实非预言。

整页声音 = voice.md「怀疑但温暖的塔罗向导」。低 AI 味、变节奏、禁套话、禁预言式承诺。
