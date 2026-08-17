# 16型恋爱人格测试 — 项目交接状态

> 当前项目事实摘要，供新线程、维护者和后续 Visual QA 使用。
>
> 最后核对：2026-08-13（Asia/Shanghai）
>
> Git 基线：`feature/xhs-external-access` @ `520fe62705f9ab32b446eb9f83bcc7566d9d7ef8`
>
> Checkpoint：`checkpoint Premium UI Preview Mode before visual QA`

如本文档与代码或 Git 状态不一致，以当前代码和 Git 为准。开始工作前还应阅读 `AGENTS.md`；人格体系的唯一横向参考是 `docs/personality-v2-matrix.md`。

## 1. 当前阶段

项目已完成核心功能、16型正式图片接入、Free/Premium 分享卡预览和 Premium UI Preview Mode。下一阶段是：

**Visual QA / UI Polish**

后续应先进行人工视觉验收，再做范围明确的 UI 调整。不要借视觉任务修改人格内容、评分、题目、TYPE映射或正式授权流程。

最近一次 Checkpoint 的工程状态：

| 检查 | 结果 |
| --- | --- |
| 自动化测试 | PASS：22个测试文件，112项测试 |
| TypeScript | PASS：`tsc --noEmit` |
| Production build | PASS：Next.js 15.5.23 |
| Diff check | PASS：`git diff --check` |

以上结果对应 Git 基线 `520fe627...`。真实生产部署、生产数据库迁移、正式域名和第三方发货链路仍需在部署环境单独确认。

## 2. 产品与技术架构

这是一个中文、移动端优先的「16型恋爱人格测试」Web 产品：

- Next.js App Router + React + TypeScript。
- Supabase PostgreSQL/Auth；管理员使用 Supabase Auth。
- 免费版为匿名8题获客体验。
- Premium 为20题正式测试，使用外部平台一单一码交付的 Access Code。
- 小红书及第三方插件负责商品、价格、订单、付款和自动发货；本程序不处理支付和订单。
- Premium 权限来自服务端 Access Session，不来自 query 参数或 localStorage。
- 完整20题由服务端计分并生成正式TYPE。
- 16型人格正文、动物、图片映射和分享卡均由共享数据/组件驱动，不维护第二套人格内容。

主要目录：

- `app/`：页面和服务端路由。
- `components/`：可复用UI与体验组件。
- `lib/`：人格、题目、评分、分享卡和共享逻辑。
- `lib/server/`：Access Code、Session、授权和数据库服务逻辑。
- `supabase/`：数据库结构与迁移。
- `assets/`：非公开源图和Premium高清图。
- `public/`：可公开访问的免费预览资源。
- `docs/`：产品、架构和冻结人格矩阵。

## 3. 当前真实用户路径

### Free

```text
/ 或 /free
→ /free/test（8题）
→ 浏览器计算初步四维与初步TYPE
→ 保存按questionId组织的免费答案快照
→ /free/result
→ 初步人格、轻量四维、个性化Locked预览、Free分享卡
→ 引导前往 /premium
```

免费8题答案可以在新建Premium attempt时预填；用户只需补答剩余12题。若已经存在Premium进度，则正式进度优先。Premium最终仍提交完整20题并由服务端重新计算，绝不沿用免费TYPE或免费分数。

### Premium

```text
外部平台付款
→ 第三方发货：网站链接 + 独立Access Code
→ /premium
→ 激活Access Code并建立HttpOnly Access Session
→ /premium/test（20题，合法快照可预填8题）
→ 服务端完成计分和正式TYPE
→ /premium/result
→ 完整V2报告、高清人格图、Premium分享卡
```

刷新或再次进入时，服务端根据有效Access Session恢复进行中attempt或已完成结果。一码绑定一个attempt和一个result。

### Admin

`/admin` 用于管理员登录、Access Code批次生成、未使用码撤销、库存和匿名结果统计。数据库只保存Access Code HMAC摘要；明文码仅在生成时一次性导出。

## 4. 正式路由与授权边界

| 路径 | 当前职责 |
| --- | --- |
| `/`、`/free` | 公开免费入口 |
| `/free/test` | 匿名8题测试 |
| `/free/result` | 免费初步结果、Locked预览和Free分享 |
| `/premium` | Premium介绍、Access Session检查和Access Code激活 |
| `/premium/test` | 受正式Access流程保护的20题测试 |
| `/premium/result` | 服务端验证Session、attempt和result后渲染完整报告 |
| `/admin` | Access Code与匿名结果管理 |
| `/api/premium/personality-portrait/[type]` | 验证正式结果归属和TYPE一致性后返回高清图 |

正式 Premium 预览旁路已经移除：

- `/premium/result?preview=XX` 不再生成预览结果。
- `/premium/test?preview=1` 不再绕过正式流程。
- 正式高清图API不接受 `?preview=` 作为授权。
- 正式结果页必须取得真实Access Session和属于该Session的服务端结果。

相关防护由 `lib/dev-premium-preview.test.ts` 和 `app/api/premium-personality-portrait.test.ts` 覆盖。

## 5. 16型人格与图片接入状态

### 人格内容

- `TYPE01–TYPE16` 是稳定ID。
- 唯一人格内容源：`lib/personalities.ts`。
- 唯一20题题库：`lib/questions.ts`。
- 免费8题从完整题库按ID引用：`lib/free-questions.ts`。
- 评分与TYPE映射：`lib/scoring.ts`。
- V2人格体系已冻结：`docs/personality-v2-matrix.md`。

### 图片资源

16型正式图片已全部接入，统一使用 `type01.webp` 至 `type16.webp`：

| 资源 | 路径规则 | 访问方式 |
| --- | --- | --- |
| 设计源图 | `assets/personality-source/v3/typeXX.webp` | 仓库内源资产 |
| Premium高清图 | `assets/personality-premium/typeXX.webp` | 非public；经授权API读取 |
| Free预览图 | `public/personality-preview/typeXX.webp` | 公开低清、模糊/残缺预览 |

映射集中在 `lib/personality-visual-assets.ts`：

- Free：`/personality-preview/typeXX.webp`
- Premium：`/api/premium/personality-portrait/XX`
- Dev Premium预览：仅开发路由内改用 `/dev/api/personality-portrait/XX`

Premium高清图没有放进 `public/`。正式API返回前会验证Access Session、正式结果归属和TYPE一致性。

## 6. 分享卡状态

正式分享逻辑没有复制第二套实现：

- Free分享卡：`lib/free-share-card.ts`
- Premium分享卡：`lib/premium-share-card.ts`
- Canvas、图片裁切和导出基础：`lib/share-card.ts`
- 分享卡规格：1080×1440 PNG

Free卡公开初步人格和测试入口，不公开Premium隐藏需求、INNER OS内心内容、完整建议或正式四维报告。Premium卡使用完整人格图和正式结果信息。

开发环境提供 `/dev/share-preview`：

- 一次展示TYPE01–TYPE16。
- 每型同时生成Free和Premium分享卡，共32张。
- 直接调用现有正式分享卡生成函数。
- 每张卡可预览并保存PNG。
- 该入口只用于视觉QA，不提供生产授权旁路。

## 7. Premium UI Preview Mode

以下入口仅在 `NODE_ENV === "development"` 时可用：

| 开发入口 | 作用 |
| --- | --- |
| `/dev/premium-preview` | Premium入口页及16型快捷目录 |
| `/dev/premium-preview/test` | 使用内存fixture查看Premium答题UI |
| `/dev/premium-preview/result/01` … `/16` | 直接查看16型完整结果UI和高清人格图 |
| `/dev/share-preview` | 32张Free/Premium分享卡横向验收 |
| `/dev/api/personality-portrait/[type]` | 仅供开发预览读取非public高清图 |

安全约束：

- 所有开发页面在非development环境调用 `notFound()`。
- Dev高清图API在非development环境返回404。
- Dev答题fixture不写数据库、不消耗Access Code、不创建正式attempt/result。
- Dev结果使用确定性的内存fixture，并明显标记开发预览。
- Dev预览不改变正式Access Code、Access Session、评分、TYPE映射或结果归属逻辑。

## 8. 已完成模块

- V2人格体系与16动物正式映射冻结。
- 免费8题与Premium20题答案继承。
- 服务端Premium授权、attempt/result归属验证和结果恢复。
- 外部交易一单一码Access Code、HMAC摘要、HttpOnly Session、激活限流和管理员库存。
- 免费结果转化页、个性化Locked预览和解锁引导。
- 公开免费根入口和Free分享链路。
- 16型源图、Premium高清图和Free低清预览全部接入。
- Free/Premium分享卡使用正式图片。
- 16型分享卡视觉QA总览。
- Premium入口、答题、16型完整结果和分享卡的开发预览入口。
- 正式Premium query预览旁路移除及安全测试。

## 9. 冻结与禁止误改

除非用户明确授权，不要修改：

- `lib/personalities.ts`：TYPE、名称、动物、poles、V2正文和Schema。
- `docs/personality-v2-matrix.md`：冻结人格体系。
- `lib/questions.ts`：20题内容、ID、选项与维度。
- `lib/free-questions.ts`：`FREE_QUESTION_IDS`。
- `lib/scoring.ts`：计分、四维阈值与TYPE映射。
- 免费答案快照格式、按questionId迁移和Premium进度优先级。
- Access Code格式、HMAC、统一错误响应和限流。
- Access Session Cookie、生命周期和服务端授权检查。
- 一码一个attempt/一个result的数据库约束。
- Premium结果页和高清图的服务端归属验证。
- `/`公开免费入口及Free/Premium信息边界。
- 正式图片文件名与三层资源路径。
- `/dev/*` 的development-only安全边界。

纯UI任务不得顺带重构这些模块，也不得清理历史兼容层。

## 10. Visual QA / UI Polish 下一步

下一阶段优先进行人工检查，不先增加功能：

1. 在 `/dev/premium-preview` 检查Premium入口、答题页和TYPE01–TYPE16完整结果。
2. 在 `/dev/share-preview` 横向检查32张分享卡。
3. 重点检查375×812、390×844以及430px附近的首屏、图片裁切、文字遮挡、按钮位置和长内容溢出。
4. 复核iPhone Safari、Android Chrome、微信和小红书内置浏览器。
5. 记录问题后按页面和组件分批修正；不要一次性重做整体UI。
6. UI调整完成后再执行完整测试、typecheck、diff-check和production build并建立独立checkpoint。

当前仍需人工确认：

- 16型图片的最终裁切和主体位置是否逐型一致。
- Free模糊/残缺预览是否既能制造期待又不会误导。
- Free/Premium分享卡在真实图片下的文字层级与可读性。
- 正式移动浏览器、生产Supabase、部署域名和第三方自动发货全链路。

## 11. 关键文件速查

| 范围 | 关键文件 |
| --- | --- |
| 项目规则 | `AGENTS.md` |
| 当前交接状态 | `PROJECT_MASTER.md` |
| 冻结人格矩阵 | `docs/personality-v2-matrix.md` |
| 人格/题目/评分 | `lib/personalities.ts`、`lib/questions.ts`、`lib/free-questions.ts`、`lib/scoring.ts` |
| Free体验 | `components/free-test-experience.tsx`、`components/free-result-experience.tsx` |
| Premium体验 | `components/home-experience.tsx`、`components/test-experience.tsx`、`components/result-experience.tsx` |
| 统一结果页 | `components/result-detail/result-detail-page.tsx` |
| 图片映射/显示 | `lib/personality-visual-assets.ts`、`components/personality-visual.tsx` |
| 分享卡 | `lib/free-share-card.ts`、`lib/premium-share-card.ts`、`lib/share-card.ts` |
| Dev预览 | `app/dev/`、`lib/dev-premium-preview.ts`、`components/share-visual-qa.tsx` |
| Access授权 | `lib/server/access-code.ts`、`lib/server/access-session.ts`、`lib/server/premium-access.ts` |
| 正式结果保护 | `app/premium/result/page.tsx`、`app/api/premium/personality-portrait/[type]/route.ts` |
| 数据库 | `supabase/migrations/`（ACTIVE）、`supabase/archive/`（历史 SQL，含 `schema.sql`/20260810/20260811） |

## 12. 开发与交接规则

常用质量门：

```bash
npm test
npm run typecheck
git diff --check
npm run build
```

`exports/` 是本地生成/归档的历史分享预览和ZIP，不参与正式代码、测试或构建，已由 `.gitignore` 排除；不要删除用户的本地内容，也不要提交该目录。

每个阶段完成后：先读取真实Git和代码状态，再更新本文档。Git保留完整历史，本文档只保留新线程继续工作所需的当前事实、锁定边界、风险和下一步。
