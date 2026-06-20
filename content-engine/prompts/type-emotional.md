# Type: C 情绪意图（emotional-intent）

读者带着高情绪的命运式问题搜索（"我前任会回来吗"）。这类词转化最高，也最容易被恐吓营销收割。**我们的特色就是：满足这个搜索，然后健康改写，把主动权还给读者**——这正是 voice 的核心招式，别人没有。

## 本页独家输入（来自 reframe-map.yaml，已为你取好）

- 原始查询 raw_query: {{RAW_QUERY}}
- 健康改写 reframed_question: {{REFRAMED}}
- 改写原因 why: {{WHY}}
- 要点名的红旗 red_flag: {{RED_FLAG}}
- 适配的牌阵提示 spread_hint: {{SPREAD_HINT}}

## 写作要求

1. **开头共情，不评判**：承认"你想知道 {{RAW_QUERY}} 是完全正常的"，不要居高临下。
2. **核心一节专门做改写**：展示如何把 "{{RAW_QUERY}}" 改成 "{{REFRAMED}}"，并讲清 {{WHY}}——为什么关于你自己的问题才能得到有用的反思。这是本页的灵魂 section。
3. **点名红旗**：自然地插入 {{RED_FLAG}}，提醒读者绕开靠这个查询收割焦虑的卖家。
4. **给一个 worked example**：用一个具体小场景演示用改写后的问题去做一次反思（可结合 {{SPREAD_HINT}}）。
5. **诚实边界**：明确塔罗不能决定另一个人的选择/未来；情绪很重的话也提示这只是一个反思输入。
6. **收在反思**，不在指令。
7. 软植入：`primary_cta` 与结尾自然导向 {{TOOL_PATH}}（问题生成器，帮读者把自己的问题问好）。related 含 {{MONEY_PATH}}。

## 给定字段

- slug: {{SLUG}}　type: info　category: "Tarot"
- title 含目标词：{{TARGET_KW}}
- cta_url: {{TOOL_PATH}}
- related: {{RELATED}}
- last_updated: {{DATE}}
- budget: "N/A (free reflection-first guide)"　delivery: "Self-guided; pairs with a written reading if you want one"　risk_level: "Low"
- hero: 填 `{ src: "{{HERO_SRC}}", alt: "{{HERO_ALT}}", caption: <一句呼应主题> }`，不要改 src
- tldr: 写一句 30-50 词速览，先给结论（这一页帮你把命运式问题改成能行动的问题）
- 结构：含一个小 "reality check" 数据点（标注为一般研究、非预言）；改写小节用对比呈现（原问题 vs 改写后），可用表格或加粗
