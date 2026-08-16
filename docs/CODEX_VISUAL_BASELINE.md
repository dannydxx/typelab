# CODEX VISUAL BASELINE

TypeLab 类型志 · 正式视觉母版基线文档

| 项目 | 值 |
| --- | --- |
| 文档性质 | 长期项目文档（跨会话可独立阅读） |
| 建立依据 | `CODEX_VISUAL_BASELINE_AUDIT`（已通过人工审核） |
| 基线分支 | `feature/workbuddy-web-v1` |
| 基线 HEAD | `402d38dd36fa3927522982fed4da37f56fa672a1`（`checkpoint Free Public Beta messaging`） |
| 适用范围 | 所有后续 WorkBuddy Task 的视觉决策入口 |

> 开启新的 WorkBuddy Task 时，**只需读取本文件**即可知道 TypeLab 当前正式视觉母版是什么，无需依赖任何历史对话。

---

## 0. 核心规则（最高优先级）

### 规则 1 — CODEX CURRENT UI = VISUAL SOURCE OF TRUTH

Codex 已完成的 TypeLab Web 视觉是唯一视觉真相来源。任何视觉判断产生分歧时，以当前仓库中已实现的代码为准，而不是以任何设计文档、历史方案或个人偏好为准。

### 规则 2 — WorkBuddy 默认继承现有视觉

WorkBuddy **不得自行重新设计整套 TypeLab**。默认行为是继承并复用 `app/globals.css` 的既有 token 与组件 class，在既有视觉语言内工作。不重新发明视觉、不重新设计页面、不以"优化"为名擅自改变已确认的视觉语言。

### 规则 3 — 当前视觉核心清单

以下构成 TypeLab 当前视觉核心，属于继承对象：

- `app/globals.css`
- TypeLab Typography
- Paper / Ink / Accent 色彩体系
- 480px mobile-first 页面框架
- Free / Premium 当前视觉体系
- Questionnaire 当前视觉体系
- Premium Result v2 editorial system
- `PersonalityVisual`
- TYPE01–16 动物资源体系
- Free Preview / Premium 高清资源隔离
- Premium / Free Share Card 视觉母版
- TypeLab wordmark

### 规则 4 — 视觉语言冻结项

以下为"视觉语言冻结"内容：

- 编辑杂志式设计方向
- Songti / Sans 中西文层级关系
- 暖纸背景体系
- 大留白
- serif 章节编号
- 动物图为主要视觉
- UI 不抢动物图
- Premium Result v2 结构
- 4:5 动物视觉比例
- TypeLab 品牌语言
- 当前分享卡视觉体系

### 规则 5 — "冻结"的准确含义

**"冻结"不等于所有 CSS 数值永久禁止修改。**

允许以后根据明确任务进行：

- 字号微调
- 间距微调
- 对齐修正
- 响应式修正
- 选中状态微调
- 动效时序微调
- CTA 位置微调

**前提**：必须保持既有视觉语言。改数值可以，改语言不行。

### 规则 6 — 必须先获得人工确认的变化

以下任何变化在动手前必须先获得人工确认：

- 重做页面布局
- 更换 Typography 体系
- 更换品牌色体系
- 改变 Result Hero 结构
- 改变动物图比例
- 改变 TYPE 图片
- 重做分享卡母版
- 把 Premium 高清图移入 `public/`
- 新建第二套 Design System

### 规则 7 — BACKLOG（不处理）

以下当前发现项**只进入 BACKLOG，本阶段不处理**：

- legacy v1 report
- options 两套实现
- Free / Premium landing 重复体系
- canvas builder 重复
- 旧 analysis 样式
- 任何所谓"顺手重构"

**没有明确任务时不得处理这些项目。** 发现即记录，不主动动手。

---

## 1. Visual Source Files

| 文件 | 角色 |
| --- | --- |
| `app/globals.css` | **唯一全局样式源**（531 行）：全部 design token + 全部组件 class |
| `app/layout.tsx` | 引入 `globals.css`、设定 lang / metadata / 字体挂载 |
| `public/brand/typelab-wordmark.png` | TypeLab 品牌字标（真实资产，约 76KB） |
| `public/personality-preview/type01–16.webp` | Free 朦胧预览图 |
| `assets/personality-premium/type01–16.webp` | Premium 完整高清图（经受保护接口下发，**不在 `public/`**） |
| `components/*.tsx` | 仅以 className 引用 globals 样式，自身不含 CSS |

关键架构事实：

1. **全站只有一份样式源。** `app/**/*.css` 仅 `globals.css` 一个；`components/` 下唯一 `.css` 是 `share-visual-qa.module.css`（Dev QA 专用，非生产视觉）。继承视觉 = 继承这一份文件 + 各组件引用的 className。
2. **生产视觉入口单一。** 所有页面挂在 `.app-shell`（`max-width: 480px` 居中纸带 + 柔阴影）下。
3. **两套报告体系并存。** v2 editorial 报告系统为正式 Source of Truth；legacy v1 报告系统仅作非 v2 类型兜底（16 型均已有 v2，实际为死分支，但保留不动）。

---

## 2. Design Tokens / Existing Rules

### Color

```
--paper           #f3f0e9   暖纸背景
--paper-light     #faf8f3   浅纸
--ink             #242321   墨色文字
--muted           #77736c   次级文字
--line            rgba(36,35,33,.18)   hairline 分隔
--accent          #6f7668   灰绿强调
--accent-soft     #c8c8b9
--danger          #9f5146
```

每型色（行内注入，不写入全局）：

- `--personality`：人格 `primaryColor`
- `--visual-primary` / `--visual-secondary` / `--visual-dark`：注入 `.visual-frame`

Free 专用：`.free-hero .primary-button #4f5b51`、`--free-premium-panel #2c302d`（深色转化面板）。

**主色使用规则（来自 `AGENTS.md`，不可违反）**：每型主色每屏出现 ≤ 5 处；禁止用 16 型主色铺满页面。

### Typography

```
--font-serif: "Songti SC","STSong","SimSun", serif
--font-sans:  -apple-system, …, "PingFang SC", …
```

- 大标题用 serif：`hero h1` `clamp(38–51px)`、`question-title` 24px、`result h1` 39px、章节编号 48px serif
- 行高普遍 1.4–2；正文以 serif 为主，元信息用 sans

### Spacing / Grid

- 无独立 spacing scale token
- gutter：`page-padding { clamp(26px, 7vw, 38px) + safe-area }`
- 章节节奏：`.v2-section` 上/下 78/82px（≤390px 时 66/70px）
- 桌面：`.app-shell max-width: 480px` 居中 + `box-shadow 0 0 60px rgba(48,43,36,.08)`

### Max width / Mobile

480px 居中纸带；`100dvh`；`env(safe-area-inset-*)`；断点 480 / 430 / 390。

---

## 3. Shared Components

| 组件 | 职责 |
| --- | --- |
| `PersonalityVisual` | 动物图 + fallback（核心视觉资产承载） |
| `ResultSection` | v2 章节壳（serif 编号 + 标题头） |
| `Questionnaire` | 答题引擎（Premium / Free / Dev 共用） |
| `ResultReveal` | 揭晓仪式 |
| `AccessCodePanel` | 付费码入口 |
| `DevPreviewBanner` | 仅 dev |
| `result-detail/*` | `PersonalitySummary` / `RelationshipSlider` / `HeartFlow` / `SafetyFormula` / `BoundaryRanking` / `AttractionTags` / `InnerVoice` / `InnerOS` / `AdviceCard` / `KeywordList` / `PersonalityQuote` |
| Share 系 | `ResultSharePanel` / `FreeSharePanel` / `PremiumShareSavePreview` |

> `Questionnaire` 与 `PersonalityVisual` 为跨页面共用件，修改它们至少属于 **L2**（见 §11）。

---

## 4. Landing Structure

- **根路由** `app/page.tsx` → `FreeHomeExperience`（`components/free-home-experience.tsx`；`/free` 同组件），`.free-*` 类系
- **Premium 入口** `app/premium/page.tsx` → `HomeExperience`（`components/home-experience.tsx`，"确认你的正式恋爱人格"）

结构：刊头 eyebrow → hero（`archive-mark` / `h1` / `hero-line`）→ `hero-facts` → 主 CTA（Free = `#4f5b51`；Premium = `AccessCodePanel`）→ footer disclaimer + 品牌字。

正式用户路径：`Landing → Free 8题 → Free Result → Premium Conversion`，承载组件为 `FreeHomeExperience` / `FreeResultExperience` / `FreePremiumPanel`。

---

## 5. Questionnaire Structure

组件：`components/questionnaire.tsx`；页面：`app/free/test`、`app/premium/test`、`app/dev/premium-preview/test`。

class 链：

```
.test-page (flex col, 100dvh)
  .test-head           eyebrow + "X / 20"
  .progress-track + .progress-fill    1px 线 + 墨色填充
  .question-stage
    .question-number   serif
    .question-title    serif 24px, min-height 防跳动
  .options / .options--cards
    .option-button / .option-button--card
       选中 = 墨底浅字 ／ 或 #e6e6dc 浅底
  .test-footer         返回上一题（ghost）
```

已确认交互：选中后有明显 Selected Feedback → 短延时自动进入下一题；允许"上一题"回改；本页不出现动物主视觉（保留 Result 揭晓冲击力）。

> 两种选项渲染模式并存（`.options` 列表描边 vs `.options--cards` 描边胶囊）→ 属 BACKLOG，不处理。

---

## 6. Premium Result Structure（v2 editorial，正式体系）

链路：`app/premium/result/page.tsx` → `components/result-experience.tsx` → `components/result-detail/result-detail-page.tsx`（v2 分支，`.result-page-v2`）。

Hero：

```
.result-hero.v2-hero
  .result-top          eyebrow + 类型号
  PersonalityVisual mode="premium"   满幅 4:5
  .result-identity     h1 人格名 + tagline + shortDescription + trait-row 关键词
  .premium-hero-save   保存按钮
```

正文：11 章节统一用 `ResultSection`（`.v2-section` + `.v2-section-header` 66px 编号列 + 标题），交替纸色区块 `v2-paper-section` / `v2-position-section` / `v2-os-section` / `v2-share-section`。

结尾：`ResultSharePanel` → `.result-share-panel` → `.result-brand`（小红书标 + wordmark）+ `.result-note`（免责）。

视觉手法：**hairline 分隔 + 大留白 + serif 编号**，非卡片堆叠。

**已确认布局**：动物图在上、人格名 / 类型号在下（图文分离），此结构属冻结项。

---

## 7. Share Card Structure（视觉母版）

Canvas 生成：

- `lib/premium-share-card.ts`、`lib/free-share-card.ts`
- 共用底座 `lib/share-card.ts`：`createShareCanvas` / `drawCoverImage` / `drawPortraitFallback` / `roundedRect` / `wrapCanvasText` / `loadImage`

Premium 卡母版：`1080×1920`，底色 `#f3f0e9`，Songti SC 写人格名与 tagline，关键词为胶囊（secondary 底 + dark 字），4 维刻度，底部 wordmark + "TypeLab 16型恋爱人格测试"，关系主张取 `share.quote`。

页内触发：`PremiumShareSavePreview`（`.premium-share-preview-backdrop` 模态）+ `ResultSharePanel`。Free 卡同为 canvas，文案标注"初步人格"。

---

## 8. Animal Asset System

组件：`components/personality-visual.tsx` → `PersonalityVisual`，两种模式：

| 模式 | 取图方式 | 说明 |
| --- | --- | --- |
| `premium` | `getPremiumPortraitUrl(id, pathname)` | 路径以 `/dev/` 开头时自动命中 `/dev/api/personality-portrait/[id]` 旁路，无需 Access Session |
| `free-preview` | `previewPortrait ?? getPersonalityVisualAsset(id).previewPortrait` | 叠加 `.portrait-preview-mask` 朦胧遮罩 + `scale(1.3) blur saturate` |

- 加载器：`next/image`
- 失败 / 缺图 → `.visual-fallback`（gradient + `visual-symbol` 动物字 + `visual-index` 编号 + caption = `visualKeywords`）
- 比例固定 `4/5`，`object-fit: cover`
- 路径解析层：`lib/personality-visual-assets.ts`（冻结）

**资源隔离原则**：Premium 高清图放在 `assets/personality-premium/`（`public/` 之外），只能经受保护接口下发；`next.config.ts` 的 `outputFileTracingIncludes` 负责打包纳入。**禁止移入 `public/`**（见规则 6）。

---

## 9. Frozen Visual Elements（禁止改变）

- 16 型动物主视觉（`PersonalityVisual` + 两套图）
- TYPE01–16 映射、Premium 高清图、Free 预览图（含朦胧遮罩）
- 当前确认的 Result 视觉体系（`.result-page-v2` editorial）
- TypeLab 类型志品牌语言（wordmark + 平台标 + 免责文案）
- 当前分享卡视觉母版（premium / free canvas）
- 人格正文（v2）、题库、评分逻辑
- Result Hero"动物图在上 + 名/类型号在下"的已确认布局
- 4:5 动物视觉比例
- 每型主色 ≤ 5 处 / 不铺满页面规则

---

## 10. Safe Areas For Future Adjustment

可在明确任务下微调（保持视觉语言不变）：

- token 数值微调（`--paper` / `--ink` / `--accent`），但不得破坏各型主色和谐
- 章节间距数值、响应式断点（430 / 390）表现
- 选项选中微交互（transform / color）
- 揭晓动画时序
- 分享卡 canvas 文案与间距
- CTA 位置微调、对齐修正

不可动（即使被视为"顺手"）：

- 每型主色使用规则
- 4:5 动物比例
- 品牌字标与 fallback 视觉
- v2 章节顺序与内容

---

## 11. Visual Change Levels

每个视觉任务在动手前先判定等级，按等级决定验证强度。

| 等级 | 定义 | 要求的验证动作 |
| --- | --- | --- |
| **L0 极速微调** | 仅极小 CSS / UI 调整 | 不启动浏览器、不测试、不 build。最多 `git diff` / `git diff --check` |
| **L1 轻量修改** | 局部组件或局部页面调整 | 只做必要验证 |
| **L2 中量修改** | 共用组件或多页面视觉变化 | 执行相关回归 + `typecheck` |
| **L3 重量修改** | 结构、业务逻辑、数据、安全、路由变化 | 执行完整相关测试 |
| **Release** | 发布 | 完整测试 + `typecheck` + `build` + 发布验收 |

判级提示：

- 改 `app/globals.css` 中被多页面共用的 class → 至少 **L2**
- 改 `Questionnaire` / `PersonalityVisual` / `ResultSection` → 至少 **L2**
- 触及 `lib/server/*`、`app/api/*`、路由、Supabase、Access 逻辑 → **L3**
- 规则 6 清单中的任何一项 → 先取得人工确认，再按 **L3** 处理

参考命令（`package.json`）：

```
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # vitest run
npm run build       # next build
```

---

## 12. Source of Truth 分类

| 类 | 含义 | 内容 |
| --- | --- | --- |
| **A** | 已冻结、应继承 | `app/globals.css` 全部 production class 与 token；`typelab-wordmark.png`；`PersonalityVisual` + fallback；premium / free share-card 母版；v2 editorial 报告体系；Typography（Songti + PingFang）；Free / Premium 已上线视觉 |
| **B** | 仅业务代码（非视觉，但被视觉引用） | `lib/questions.ts`、`lib/free-questions.ts`、`lib/scoring.ts`、`lib/personalities.ts`、`lib/config.ts`、`lib/server/*`、`lib/supabase/*` |
| **C** | 开发 Preview（非生产视觉） | `app/dev/*`、`components/dev-preview-banner.tsx`、`components/dev-premium-test-experience.tsx`、`components/share-visual-qa.tsx`、`lib/dev-premium-preview.ts`、`.dev-preview-*` |
| **D** | 历史 / 废弃视觉（保留不动） | legacy v1 报告（`.result-page` 非 v2、`.dimensions`、`.report`、`.report-block`、`.report-number`，含旧 `text-align: justify`）；`.analysis-*`；`.modal` / `.modal-backdrop` |
| **E** | 重复实现，待确认（**BACKLOG，不处理**） | ① v2 与 legacy 双报告体系并存；② premium / free 两套 canvas builder；③ `.options` vs `.options--cards`；④ Free / Premium 双 landing + 双类系；⑤ 16 型是否全部带 v2（若全部带，则 legacy 为死代码） |

---

## 13. 历史方案作废声明

本分支早期产出的以下方案**已被本基线取代，不再作为设计依据**：

- `WORKBUDDY_WEB_V1_DESIGN_PLAN`（"柔雾档案 Soft-Focus Archive"独立设计方向）
- `TYPELAB_GOLDEN_SCREENS_WIREFRAME_V1 / V2`（WorkBuddy 平行对比版线框）
- `DOUYIN_MIGRATION_GAP_ANALYSIS`（抖音小程序迁移方向）

方向已从"WorkBuddy 另做一套对比 UI"变更为"**Codex 视觉即母版，WorkBuddy 继承后继续开发上线**"。后续任何 WorkBuddy 侧改动都应复用 `globals.css` 的 token 与现有组件 class，而非另起一套设计语言。

---

## 14. 新 Task 开场检查清单

开启新的 WorkBuddy 视觉任务时按序确认：

1. 读本文件，确认要改的东西是否落在 §9 冻结项或规则 6 清单内 → 若是，先要人工确认
2. 判定 Visual Change Level（§11），据此决定验证强度
3. 确认是否属于 §12-E / 规则 7 的 BACKLOG 项 → 若是且无明确任务，不处理
4. 改动优先复用既有 token 与 class，不新增平行样式体系
5. 完成后按等级执行对应验证，并报告改动范围
