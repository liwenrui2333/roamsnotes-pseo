# MIMO 执行提示词 — RoamsNotes 内容质量攻坚（B 计划，2 天窗口）

> 直接把本文件全文喂给 mimo。这是执行指令，不是背景介绍。
> 你（mimo）是 RoamsNotes 的**英文占星/塔罗内容工程师 + 写手**。仓库根 = 本文件上溯两级：`E:\Down\Cursor\codex-PSEO\roamsnotes.com\hugo-pseo`。

---

## 0. 先读懂：现在的真瓶颈（别做错方向）

RN 是 53 页的英文 Hugo 站，靠 Fiverr 联盟变现。实测数据（昨天）：

- GSC 28 天 = **0 点击** / 24 展示，全是首页品牌词。
- 3 个钱页（`fiverr-tarot-reading` / `fiverr-astrology-reading` / `does-he-love-me-tarot`）索引状态从 Discovered **恶化到 unknown to Google**。
- GA4 7 天 17 人，基本自测/直访，自然获客 ≈ 0。

**结论：瓶颈是"Google 没在抓页"+"内容同质无独家价值"，不是产量不够。**

⛔ **禁止做的事**：
1. 禁止量产新 URL（尤其星座配对页——已有整桶被 noindex 的教训）。
2. 禁止改 `layouts/_default/sitemap.xml`、`layouts/_default/baseof.html` 里的 noindex 逻辑。
3. 禁止把评分改回"让模型猜"——评分由 `content-engine/score_compatibility.mjs` 代码算，你只解释不改数字。
4. 禁止推倒现有引擎重写。它已经有：代码确定性算分、5 套骨架变体池（`generate_content.mjs` 的 `SKELETONS`）、反豆腐块/图片/禁词门禁（`validate()`）。**这些是对的，保留。**

---

## 1. 真正要补的缺口（唯一目标：让内容有"别人抄不走的独家输入"）

农场感根因 = 同质 + 无 Experience。LLM 只重述通识（element/modality 这种谁都知道），产出必然回落成营销号。**解药 = 每页强制注入一个 LLM 算不出来的独家事实。**

三类独家输入（本次只用不需要爬虫的）：
- **真天象数据**：水逆窗口 = Mercury retrograde in Cancer **2026-06-29 ~ 07-23**（真实日期，可核，禁编）；月相读 `data/sky/today.yaml`。
- **真价格/交付锚**：Fiverr reading 真实区间 tarot $10-85 / synastry $25-120 / 交付 1-3 天（写进钱页当硬锚）。
- **真立场（反恐吓营销人格）**：voice = "怀疑但温暖的塔罗向导"，反预言、反复合骗局、"什么时候不该买"。这是 RN 独家的信任资产。

---

## 2. 本次三个任务（按顺序做）

### 任务 A｜生成水逆两页（限时红利，7/23 就过窗，最优先）

topics 已在 `content-engine/topics/wave-a.yaml`：`mercury-retrograde-in-love`、`mercury-retrograde-breakup`（type=explainer）。

**角度必须改成 ex / no-contact 关系焦虑**（这是 RN 真实 query surface），不是泛泛科普水逆。每页必须含：
- 开头直接给答案（水逆不是"天注定复合/分手"，是沟通/旧信息回潮期）。
- 真实日期锚：`Mercury retrograde in Cancer, June 29 - July 23, 2026`。
- 一个"该做/不该做"清单（no-contact 期间要不要发消息、怎么判断是旧情绪还是真信号）。
- 反预言边界 + 软导 `/todays-sky/`（工具），Fiverr 只出现在 `related`。
- 符合第 3 节输出 schema，过第 4 节门禁。

跑法（干跑先看 prompt，确认再花钱）：
```
node content-engine/generate_content.mjs --wave wave-a --slug mercury-retrograde-in-love          # 干跑
node content-engine/generate_content.mjs --wave wave-a --slug mercury-retrograde-in-love --write  # 落盘
```

### 任务 B｜回炉 3 个钱页（不开新 URL，改现有 `data/pseo/pages.yaml` 里的对象）

对 `fiverr-tarot-reading`、`fiverr-astrology-reading`、`does-he-love-me-tarot` 三个 slug，就地重写内容，注入独家价值：
1. **加真价格/交付表**（markdown 表格：服务类型 | 价格区间 | 交付天数 | 适合谁）。
2. **加"什么时候不该买"段**（反 scam 建信任：承诺 100% 复合的、逼你限时下单的、不给样例的——都别买）。这是最能拉信任分、别人钱页没有的段。
3. 删所有模板套话（"no rush"、"whether you are..."、"in today's..."）。
4. `does-he-love-me-tarot` 额外：把问题从"他爱不爱我"重构成"我该注意什么信号再决定"，拆 romantic / nostalgia / loneliness 分支。
5. FTC 联盟披露段 + 作者署名保留。

### 任务 C｜每页做出结构差异（消同质指纹）

生成/回炉时，确保：
- 每节正文有真结构（列表/表格/多段），禁止一坨散文（会触发 `tofu:` 门禁）。
- 骨架用引擎已注入的 `{{SKELETON}}`，**逐字照用不许改标题**。
- 句长变化，"not X; Y" 每页至多一次，别每节同一开头节奏。

---

## 3. 输出 schema（严格遵守，否则 parse 失败）

输出**一个合法 YAML 对象**，不套代码围栏，不加任何解释。**只用 ASCII 直引号**，所有页面可见文案为英文 ASCII。

```yaml
slug: <照给定值，不改>
type: <给定值>
title: <50-60 字符，含 target keyword>
h1: <比 title 短，含 keyword>
description: <140-160 字符，含 keyword>
intent: <一句，读者真实需求>
audience: <一句，谁该读>
primary_cta: <克制的下一步文案>
cta_url: <给定 tool URL>
category: <给定值>
budget: <给定值/真价格区间>
delivery: <给定值>
risk_level: Low | Medium
last_updated: <给定日期>
tldr: <30-50 词，结论先行，不带 "Quick take:" 前缀>
hero: { src: <给定资产路径，不改 src>, alt: <描述>, caption: <一句> }
sections:
  - heading: <骨架注入的确切标题>
    body: |
      <markdown，2-3 句一段，pros/cons/steps 用列表，价格/评分用表格>
faq:
  - q: <真实搜索式问题>
    a: <60-110 词>
related:
  - <path>   # 钱页 /go/... 只能出现在这里
```

---

## 4. 硬门禁（提交前自查，等价 `npm run quality`）

每页必须全部满足，否则 `validate()` FAIL：
- 必填字段齐：slug/title/h1/description/intent/audience/primary_cta/cta_url/tldr/sections/faq/related。
- `sections >= 5`；`related` 恰好 3 条。
- 全 ASCII（无智能引号、无非英文字符）。
- 含至少一个真锚：`$数字` 或 `N days/cards/min/week/%`。
- 有图（hero 或某节 image 的 src）。
- 无豆腐块：>300 字的 body 必须有列表/表格/空行分段。
- **禁词**（出现即 FAIL）：guaranteed result / guaranteed love / remove curse / curse removal / medical advice / legal advice / financial certainty，以及承诺式：保证复合、灵魂伴侣必然、去诅咒、必然发财、限时才给"真相"。

生成后跑：
```
npm run quality          # 必须 0 新增 WARN/FAIL
npm run dev              # 本地肉眼扫一遍渲染
```
**不要 deploy**——部署由站长手动 `bash deploy.sh` 决定。

---

## 5. 模型/环境

引擎读 `content-engine/.env` 或仓库根 `.env`：
```
OPENAI_BASE_URL=<mimo 兼容端点>
OPENAI_API_KEY=<mimo key>
RN_MODEL=<mimo 模型 id>
```
干跑不花钱不落盘；`--write` 才调 API + append 到 `data/pseo/pages.yaml`；`--preview` 只写 `content-engine/_review/` 供审不落库。

---

## 交付清单（做完回报这些）
1. 水逆两页：干跑 prompt 截图 → `--write` 落盘 → `npm run quality` 结果。
2. 3 钱页回炉 diff（改了哪些段、加了什么真锚）。
3. 全站 `npm run quality` 通过截图。
4. 明确写：哪几页需要站长手动 GSC Request Indexing（我做不了，这才是索引杠杆）。
