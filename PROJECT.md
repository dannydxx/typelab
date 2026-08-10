# Project Overview

## Status

Version 1 of the Chinese mobile H5 product “16型恋爱人格测试” is implemented and preparing for production configuration and deployment.

The product has two independent journeys: a public 8-question acquisition experience at `/` and `/free`, and an Access-Session-gated 20-question experience at `/premium`. Xiaohongshu owns product display, price, order, payment, and automatic delivery; the application validates only the one-order-one-code delivery credential.

## Workspace Scope

`/Users/dannyleung/Documents/New project` is the only authorized project workspace. All code, configuration, SQL, documentation, assets, and generated output must remain inside this directory unless the user explicitly authorizes an exception.

## Architecture Baseline

- Next.js App Router + TypeScript for the mobile H5 and server API routes
- Supabase PostgreSQL for Access Code inventory, HttpOnly session records, attempts, anonymous result statistics, and administrator accounts
- Server-only Supabase service key for all protected operations; no business tables are directly readable from the browser
- Vercel as the intended production deployment target
- Local storage only for unfinished answers and free-result continuity; it can never grant Premium access
- Shared personality/question/scoring/UI resources with isolated free and premium route and storage namespaces

## Engineering Principles

- Keep implementation scoped, understandable, and testable.
- Use version-controlled configuration templates; never commit real secrets.
- Keep dependencies and build scripts declared in the project manifest.
- Treat `AGENTS.md` as the mandatory operating agreement for all project work.

## 正式人格 IP 规则

TYPE 编号是历史结果、评分组合、前后端统计和视觉资源的稳定 ID。16 种人格使用固定且互不重复的动物 IP；未经用户明确许可，不得改动 TYPE 与动物的对应关系，也不得重新引入重复动物。

| TYPE | 正式人格名称 | 动物 |
| --- | --- | --- |
| 01 | 晴岛小狗型 | 狗 |
| 02 | 橘光狐狸型 | 狐狸 |
| 03 | 晚风白鹿型 | 白鹿 |
| 04 | 松林白猫型 | 白猫 |
| 05 | 星轨雪豹型 | 雪豹 |
| 06 | 海盐海鸥型 | 海鸥 |
| 07 | 青山白鹤型 | 白鹤 |
| 08 | 深海鲸歌型 | 鲸 |
| 09 | 蜜糖小熊型 | 熊 |
| 10 | 烟火兔型 | 兔 |
| 11 | 月光刺猬型 | 刺猬 |
| 12 | 雨夜天鹅型 | 天鹅 |
| 13 | 琥珀狼型 | 狼 |
| 14 | 极光水獭型 | 水獭 |
| 15 | 雾岛猫头鹰型 | 猫头鹰 |
| 16 | 雪夜乌鸦型 | 乌鸦 |

唯一当前数据源是 `lib/personalities.ts`。免费版、完整版、分享卡和后台统计都必须通过该文件按稳定 TYPE ID 读取名称、动物、关键词、图片和颜色。图片路径固定为 `public/personality/type01.webp` 至 `type16.webp`。

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-09 | Created initial project overview and repository baseline. |
| 2026-08-09 | Implemented the first production-oriented love personality test product. |
| 2026-08-09 | Added the independent free acquisition journey and reorganized shared resources. |
| 2026-08-10 | Updated the formal personality IP system to a fixed, unique 16-animal mapping while preserving stable TYPE IDs. |
| 2026-08-10 | Replaced the internal purchase/code model with a server-side Xiaohongshu Premium entitlement boundary. |
| 2026-08-11 | Replaced the unimplemented platform entitlement boundary with external-commerce one-order-one-code delivery and HttpOnly Access Sessions. |
