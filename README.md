# 16型恋爱人格测试

中文移动端 H5 产品，使用 Next.js App Router、TypeScript、Supabase 与 Vercel。产品包含匿名免费8题体验，以及由外部交易完成后的一单一码保护的20题完整版。

## 产品入口

- `/`、`/free`：公开免费入口
- `/free/test`：8题免费测试
- `/free/result`：免费初步结果、锁定预览与免费分享
- `/premium`：完整版介绍与 Access Code 输入
- `/premium/test`：受 Access Session 保护的20题测试
- `/premium/result`：受服务端保护的正式报告
- `/admin`：Access Code 库存与匿名结果统计

小红书负责商品展示、标价、支付、订单和自动发货。本程序不展示价格、不创建订单、不处理付款，也不调用小红书订单或支付 API。自动发货内容由固定测试 URL 和唯一 Access Code 组成。

## Access Code 授权模型

```text
小红书完成交易
→ 第三方自动发货插件发出唯一Access Code
→ POST /api/access/activate
→ 服务端HMAC摘要验证
→ HttpOnly Access Session
→ Premium attempt / result / full portrait
```

- Access Code 格式为 `XXXX-XXXX`，排除 `0/O/1/I/l` 等易混淆字符。
- 数据库只保存 Access Code 的 HMAC 摘要，明文仅在后台生成下载时出现一次。
- 首次激活后有72小时测试窗口，通过 `ACCESS_TEST_TTL_HOURS` 配置。
- 正式结果生成后进入30天只读查看窗口，通过 `RESULT_VIEW_TTL_DAYS` 配置。
- 一个 Access Code 只绑定一个正式 attempt；重复进入会恢复原进度或正式结果。
- Access Session 使用 HttpOnly、SameSite=Lax、Path=/ Cookie，生产环境启用 Secure。
- `localStorage`、query 或客户端伪造状态不能授予 Premium 权限。
- 结果查看窗口结束后不再放行 Premium 内容，但数据库中的正式结果不会删除。

受保护入口：

- `POST /api/attempts/start`
- `POST /api/attempts/complete`
- `/premium/result`
- `GET /api/premium/personality-portrait/[type]`

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

本地验证 Premium 需要配置 Supabase、执行数据库迁移，并通过 `/admin` 生成一次性 Access Code 文件。程序不再提供平台 entitlement fixture。

## 环境变量

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `ACCESS_CODE_HASH_SECRET`：仅服务端，用于 Access Code HMAC
- `ACCESS_SESSION_HASH_SECRET`：仅服务端，用于 Session token HMAC
- `ACCESS_RATE_LIMIT_SECRET`：仅服务端，用于激活限流身份摘要
- `ACCESS_TEST_TTL_HOURS`：测试窗口，默认72小时
- `RESULT_VIEW_TTL_DAYS`：正式结果只读查看窗口，默认30天

生产环境的两个 HMAC 密钥应使用不同的高强度随机值。不要提交 `.env.local`、明文 Access Code 库存或生产凭据。

## 免费答案继承

免费完成8题后，原始答案按 question ID 存为 `FreeAnswerSnapshot`。Access Code 激活并创建新的 Premium attempt 时，8题答案填入完整20题对应位置，用户只需补答12题。没有合法快照的用户正常完成全部20题。最终 TYPE 始终由服务端用完整20题重新计算。

## Access Code 库存

管理员可在 `/admin`：

- 创建单产品批次并填写批次标签
- 生成10至1000个随机码
- 一次性下载 CSV 或 TXT
- 查看总数、未使用、已激活、已过期、已撤销
- 查看最近批次及其72小时有效策略
- 整批撤销尚未激活的库存，处理明文下载失败等运营事故

数据库无法还原明文，因此下载文件遗失后不能重新导出同一批明文码。

## 人格与视觉数据

- 唯一人格内容源：`lib/personalities.ts`
- 固定 ID：`TYPE01–TYPE16`
- 免费预览资源：`public/personality-preview/type01.webp` 至 `type16.webp`
- 完整资源：通过受保护接口读取
- V2 横向矩阵：`docs/personality-v2-matrix.md`

人格正文、动物映射、评分逻辑与 Access Code 授权层相互独立。

## 数据库

新项目 / 新环境数据库初始化使用以下 **ACTIVE DATABASE MIGRATIONS**（按依赖顺序执行）：

```text
supabase/migrations/20260817000001_typelab_clean_base.sql
supabase/migrations/20260817000002_fix_access_session_unique.sql
supabase/migrations/20260817000003_fix_activate_access_code_ambiguity.sql
```

- `supabase/archive/` 仅存放历史 SQL（`schema.sql`、`20260810_xhs_native_entitlements.sql`、`20260811_external_access_codes.sql`），**不得用于新项目初始化**。
- 当前 TypeLab-SG 已通过 Supabase SQL Editor 手工初始化并真实 E2E 验证，**尚未接管 Supabase CLI migration history**。
- 在执行任何 `supabase db push` 之前，必须先完成 migration-history adoption / `supabase migration repair --status applied`，否则会重复应用或误应用历史 SQL。

V3.6 采用的增量策略（不 DROP 历史表，新增 `access_code_batches`/`access_codes`/`access_sessions`，现有 `test_attempts`/`test_results` 支持 `access_code_id`）已并入上述 clean base；V3.5 的 XHS entitlement 对象保留在 archive 供审计，但已退出运行时授权链。

## 质量检查

```bash
npm test
npm run typecheck
git diff --check
npm run build
```
