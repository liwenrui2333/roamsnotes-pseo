# Type: 今日天象 / Today's Sky（sky）

读者搜 "today's moon" / "moon phase today" / "what does today's sky mean" / "cosmic weather today"。
全网同类内容 99% 是**通用每日星座号**——12 句空话、套刻板印象、做预言。Google 压制这类。
**我们的特色：只用今天真实可算的天象事实（月相/照明度/水逆状态/太阳所在星座）当锚，做反思式解读，绝不预言、绝不编造没有的行星相位。**

这是日更页（slug 固定 `todays-sky`，每天重写）。写得像一个懂占星但不靠它吓人的向导，今早抬头看了眼天、给读者一段诚实的"今天宜想清楚什么"。

## 本页独家输入（来自 data/sky/today.yaml，今天真实数据，已为你取好）

- 日期 date: {{DATE}}
- 月相 moon_phase: {{MOON_NAME}} {{MOON_EMOJI}}（照明度 illumination: {{MOON_ILLUM}}%）
- 太阳所在星座 sun_sign: {{SUN_SIGN}}（{{SUN_SEASON}}）
- 水星逆行 mercury_retrograde: {{MERCURY_RX}}
- 月相在反思上的一般含义（参考，不是预言）: {{PHASE_MEANING}}

**硬约束**：你只能用上面这些事实。**不要**编造月亮星座、行星相位、具体吉时、"今天会发生什么"。没有的数据就不提（诚实默认）。月相含义只能讲"适合什么样的内在工作"，不能讲"今天你会……"。

## 写作要求

1. **开头落在真实的天**：用今天真实的月相+照明度起笔（"今晚的月亮是 {{MOON_NAME}}，约 {{MOON_ILLUM}}% 被照亮"），具体、可验证，不玄乎。
2. **把月相翻译成反思，不是预言**：基于 {{PHASE_MEANING}} 讲这个月相**邀请**你做什么样的内在工作（盘点/启动/释放/沉淀），明确这是一个反思节律，不是命运预测。
3. **太阳星座只讲季节性主题**：{{SUN_SIGN}} 季节适合关注的生活面向（用元素/季节常识，不套个人化星座预言）。
4. 若 {{MERCURY_RX}} 为真：诚实讲水逆"常被甩锅"的真相——它不会替你做决定，最多提醒你复查沟通与计划；若为假，**完全不提水星**。
5. **一个 reality check 数据点**：月运周期约 29.5 天这类可验证事实，标注为天文常识、非预言。
6. **给一个今天能用的小动作**：一句话的反思提问或一次单牌自检（可导向问题生成器工具），落在"想清楚什么"。
7. **诚实边界**：天象是背景节律，不决定你的具体选择；情绪重时这只是一个反思输入。
8. 收在反思，不在指令。软植入 `primary_cta` 自然导向 {{TOOL_PATH}}（帮读者把今天的问题问好）。

## 给定字段（严格按此输出一个 JSON 对象，ASCII 双引号，不要 markdown 代码围栏）

- slug: "todays-sky"　type: "info"　category: "Astrology"
- title: 含日期与月相的标题，如 "Today's Sky ({{DATE}}): {{MOON_NAME}} and What It's Good For"
- h1: 与 title 呼应，含 "Today's Sky"
- description: 50-60 词 meta，先说今天月相再说这页帮你做什么反思
- intent: 一句读者来意　audience: 一句目标读者
- primary_cta: 软性号召（导向问题生成器）　cta_url: "{{TOOL_PATH}}"
- related: {{RELATED}}（必须正好 3 个）
- last_updated: "{{DATE}}"
- budget: "N/A (free daily reflection)"　delivery: "Updated daily; read in 3 min"　risk_level: "Low"
- hero: { "src": "{{HERO_SRC}}", "alt": "{{HERO_ALT}}", "caption": "<一句呼应今天月相的话>" }（不要改 src）
- tldr: 30-50 词速览，先给结论（今天月相是什么 + 适合做什么内在工作）
- sections: **5-6 节**，每节 { "heading": ..., "body": ... }。body 必须有结构（列表/表格/多段，禁一坨豆腐块）。至少含：①今天天上真实发生什么 ②这个月相邀请的反思 ③{{SUN_SIGN}} 季节主题 ④reality check 数据点 ⑤今天能用的小动作。
- faq: 3 条 { "q":..., "a":... }，问真实长尾（如 "What moon phase is it today?" / "Does the moon affect mood?" / "Is mercury retrograde today?"），答案只依据给定事实，诚实非预言。

整页声音 = voice.md 的"怀疑但温暖的塔罗向导"。低 AI 味，变节奏，禁套话，禁预言式承诺。

- 禁止出现确切短语 "medical advice"、"legal advice"、"financial certainty"、"guaranteed result"、"remove curse"、"curse removal"（会被 quality gate 判 FAIL）。免责声明改用 "medical care"、"legal counsel" 等等价措辞。
