# Type: B 牌阵教程（spread）

读者想学一个具体牌阵（"three card spread"）。这是教学型信息页：真的教会读者怎么用，给足价值，再软导向"想要真人解读"的可选下一步。

## 本页独家输入（来自 topics 的 spread_data，已为你取好）

- 牌阵名 spread_name: {{SPREAD_NAME}}
- 位置定义 positions: {{POSITIONS}}   # 每个位置的含义，按顺序
- 适合的问题类型 best_for: {{BEST_FOR}}
- 常见误用 common_mistake: {{COMMON_MISTAKE}}

## 写作要求

1. **先讲这个牌阵是干嘛的**：一句话定位 + best_for，不要泛泛。
2. **逐位置拆解**：用 {{POSITIONS}} 把每个牌位讲清楚——这是页面的核心价值，必须具体、可照做。
3. **示范一次提问**：给一个真实问题 + 这个牌阵怎么映射（worked example）。
4. **点名 common_mistake**：明确这个牌阵最容易被误用的地方（如把"建议位"读成"预言位"）。
5. **诚实边界**：牌阵帮你结构化思考，不是给你确定答案；保持 voice 的反预言立场。
6. 软植入：`primary_cta` 与结尾导向 {{TOOL_PATH}}（问题生成器，帮读者为这个牌阵问对问题）。related 含 {{MONEY_PATH}}。

## 给定字段

- slug: {{SLUG}}　type: guide　category: "Tarot"
- title 含目标词：{{TARGET_KW}}
- cta_url: {{TOOL_PATH}}
- related: {{RELATED}}
- last_updated: {{DATE}}
- budget: "Free to do yourself; a written reading runs $5-$35 if you want one"　delivery: "Self-guided tutorial"　risk_level: "Low"
- hero: 填 `{ src: "{{HERO_SRC}}", alt: "{{HERO_ALT}}", caption: <一句> }`，不要改 src
- tldr: 写一句 30-50 词速览
- 结构（SERP 获胜）：除给定牌阵外，再给 2-3 个**命名变体**（如 past/present/future、situation/influence/guidance、mind/body/spirit），每个一段位置说明 + 一个步骤有序列表；解读单独成节
