# RoamsNotes 内容引擎（v3）— 「数据 → 人格 → 稿」

把 GPT 从"自由发挥的搬运营销号"改造成"执笔工具"。特色不来自模型，来自**独家输入 × 一致人格**。

> 公式：**特色 = 独家输入(脚本/数据) × 一致人格声音(voice.md) ÷ GPT(只执笔)**

## 为什么这样设计

直接让 GPT「写一篇关于 X 的文章」= 全互联网平均值 = 搬运营销号。本引擎强制两件事：
1. **每篇稿都注入独家数据**（情绪改写映射 / 真实星座要素 / data/sky 天文 / Fiverr 市场聚合），模型只能在这些事实上推理，写不出泛泛而谈。
2. **每篇稿都用同一个人格**（`voice.md` 的"怀疑但温暖的塔罗向导"），立场一致、敢下判断 = 像一个有观点的博主，不像内容农场。

## 管线

```
topics/<wave>.yaml        ← 选题队列（slug/类型/目标词/内链/数据引用）
        │
        ▼
generate_content.mjs
  ├─ 1 assemble data   按 type 取独家数据：reframe-map / sign-traits / sky / spreads
  ├─ 2 build prompt    system = voice.md + prompts/system.md ; user = prompts/type-<t>.md 填充
  ├─ 3 call API        OpenAI 兼容 chat completions（OPENAI_BASE_URL + OPENAI_API_KEY）
  ├─ 4 validate        本地校验：锚点 / 禁词 / 人格标记 / 长度 / 内链占位
  └─ 5 emit            写入 data/pseo/pages.yaml（schema 兼容）
        │
        ▼
npm run quality && npm run generate && hugo --minify   ← 现有管线，零改动
```

人格与数据是"脑"，本仓库现有的 `quality_gate.js`（禁词/锚点/新鲜度门禁）是"安检"，`generate_pages.js` 是"排版"。引擎只负责产出合规的 pages.yaml 对象，后续完全复用。

## 用法

```bash
# 0) 配置 API（OpenAI 兼容端点，含中转）
export OPENAI_BASE_URL="https://api.openai.com/v1"   # 或你的中转 base_url
export OPENAI_API_KEY="sk-..."
export RN_MODEL="gpt-4o"                              # 可改

# 1) 干跑：只组装 prompt 打印出来，不调 API、不花钱、不写盘（默认）
node content-engine/generate_content.mjs --wave wave1

# 2) 单篇真跑：生成 1 个 slug，写入 pages.yaml
node content-engine/generate_content.mjs --wave wave1 --slug is-my-ex-coming-back-tarot --write

# 3) 整波真跑（跳过 pages.yaml 已存在的 slug）
node content-engine/generate_content.mjs --wave wave1 --write

# 4) 过安检 + 排版 + 预览
npm run quality && npm run dev
```

`--write` 才会调 API 和落盘；不带 `--write` 永远是干跑。每篇真跑后人工扫一眼再 `bash deploy.sh`。

## 目录

```
content-engine/
├── README.md                  本文件：架构 + 用法
├── voice.md                   ÷GPT：塔罗向导人格定义（系统提示核心）
├── generate_content.mjs       引擎脚本（ESM，复用 yaml 依赖，Node 18+ 原生 fetch）
├── prompts/
│   ├── system.md              全局约束：结构 / 反 AI 指纹 / 合规红线
│   ├── type-emotional.md      C 情绪意图模板
│   ├── type-spread.md         B 牌阵模板
│   └── type-compatibility.md  D2 星座配对模板
├── data/
│   ├── reframe-map.yaml       ×独家输入：情绪查询 → 健康改写（= 品牌立场）
│   └── sign-traits.yaml       ×独家输入：12 星座要素/模式/守护星（真实占星事实）
└── topics/
    └── wave1.yaml             Wave 1 选题队列（20 个 slug）
```

## 扩到 Wave 2/3

- Wave 2（牌意/星座档案）：加 `data/card-meanings.yaml`（78 牌的位置/元素/数字事实）+ `prompts/type-card.md`，topics/wave2.yaml。
- Wave 3（运势/日历）：数据源换成 `data/sky/*.yaml`（已有 update_sky.js），人格不变，新增 `prompts/type-horoscope.md`。回访引擎=每日重算 sky → 重跑 → 重新部署。
- Fiverr 市场报告：独立 `data/market/` 聚合脚本产出统计，喂 `prompts/type-report.md`，是唯一可转发的原创数据稿。
