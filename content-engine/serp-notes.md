# SERP 逆向：获胜模板（2026-06-20，零数据时的客观靶子）

没有自己的流量数据时，用 Google 已排好的第 1 页当"被验证的模板"。下面是 3 个 Wave-1 代表词前排结构提炼，已固化进 prompts/ 与模板。

## 跨词通用信号（3 个词都成立）

1. **页面带可交互免费工具会排上去**：ifate 的"洗牌/抽牌"、psychicworld 的"配对计算器"都在前排 → 印证工具引擎策略。每页强链对应工具。
2. **图是功能性的，不是装饰**：牌阵位置图、牌面图、配对评分条、星座符号。不是图库摆拍。
3. **可扫读结构**：要点用项目符号、步骤用有序列表、评分用表格——**没有一个前排是大段豆腐块**（直接判我们旧渲染死刑）。
4. **有一个数字锚**：百分比、统计（如约 30% 前任复合）、分项打分。
5. **该铺广度就铺**：牌阵类页面靠"一页给很多个牌阵"赢（Labyrinthos 18 个 / Biddy 25 个）。

## 按类型的获胜结构（已写进 prompts/type-*.md）

### C 情绪意图（will my ex come back tarot）
- 前排：ifate 互动抽牌、eldrintarot "grounded guide"、embroideredforest "6 个 ex 牌阵"、tx-psychics "no-contact 时机"。
- 我们要：reframe 差异化**保留**，但补：① 一个免费反思牌阵的**位置图** ② 一个小"现实核查"数据框（如复合统计，标注是一般研究非预言）③ 诚实边界小节。
- 别学的：tarotwithlavanya / tarostarot 那种"免费预测他会不会回"——正是我们反对的恐吓/预言式，踩合规红线。

### B 牌阵（three card tarot spread）
- 前排全是**多牌阵清单**（18/25 个）+ Labyrinthos 的干净**位置示意图**。
- 我们要：单页给 **3-4 个命名变体**（past/present/future、situation/influence/guidance、mind/body/spirit、relationship 版），每个配**位置图** + 步骤有序列表 + 解读/连牌成故事小节。把原来"只讲一个牌阵"扩成清单页。

### D2 星座配对（aries and leo compatibility）
- 前排主导格式 = **分项评分表**（astrotalk/psychicworld：Love、Communication、Passion/Intimacy、Trust/Loyalty 各给 %）+ Strengths/Challenges 项目符号 + 配对计算器。
- 我们的杀手锏：**多数站的百分比是拍脑袋的；RN 用真实元素+模式规则算分并公开算法**（"how we score this"）= 原创 + 可信。
- 我们要：① 一张分 5 项的评分表（Love/Communication/Passion/Trust/Long-term，各 % + 一句为什么，从 element/modality 推）② Strengths 与 Challenges 各一组项目符号 ③ 两个星座符号图 ④ 软链合盘计算器。

## 落地映射

- 模板 `pseo-page.html`：body 改 `markdownify`（解锁分段/清单/表）+ 每节可选 `image` + 页级 `hero` + `tldr`。
- `prompts/system.md`：强制 markdown 分段（每段≤3 句）、能列就列、评分/价格用表、配图占位用给定 slug。
- `data/assets.yaml`：星座符号字形 + 元素色；塔罗用公共领域 Rider-Waite 牌面（`scripts/fetch_rws.mjs` 按需下载到 static/img/tarot/）。
- `quality_gate.js`：加豆腐块检测（每节正文须含清单/表/多段，否则 FAIL）+ 资产门禁（每页须有 hero 或节内图）。
