# 16型恋爱人格测试

中文移动端 H5 产品，使用 Next.js App Router、TypeScript、Supabase 与 Vercel。产品包含匿名免费8题体验和受小红书商品权益保护的20题完整版。

## 产品入口

- `/`：公开免费入口
- `/free`：免费入口兼容地址
- `/free/test`：8题免费测试
- `/free/result`：免费初步结果、报告预览与免费分享
- `/premium`：完整版权益检查入口
- `/premium/test`：受服务端权益保护的20题测试
- `/premium/result`：受服务端权益保护的正式结果

商品展示、价格、订单和支付由小红书原生商品体系负责。本程序不提供价格、支付、兑换码或自建购买流程。

## 权限模型

业务页面和 API 只依赖统一 `PremiumEntitlement`：

```ts
type PremiumEntitlement = {
  entitled: boolean;
  source: "xiaohongshu";
  productId?: string;
  orderId?: string;
  grantedAt?: string;
};
```

服务端适配入口位于 `lib/server/xhs-entitlement.ts`。当前真实小红书身份与订单能力尚未接入，状态为 `PENDING_XHS_PLATFORM_INTEGRATION`；生产环境没有真实权益时始终拒绝 Premium。

受保护入口包括：

- `POST /api/attempts/start`
- `POST /api/attempts/complete`
- `/premium/result`
- `GET /api/premium/personality-portrait/[type]`

客户端 storage、query、header 或免费结果都不能赋予 Premium 权限。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

如需本地测试 Premium，在 `.env.local` 显式设置：

```env
XHS_ENTITLEMENT_FIXTURE=entitled
XHS_FIXTURE_SIGNING_SECRET=仅用于本地的随机字符串
```

fixture 只在 development/test 生效，production 不会默认授权。删除或改回 `not-entitled` 即可检查无权益状态。

## 环境变量

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_XHS_PRODUCT_URL`：可选，只有获得真实平台跳转能力后填写
- `XHS_APP_ID`：待真实平台接入
- `XHS_PREMIUM_PRODUCT_ID`：待真实平台接入
- `XHS_PLATFORM_SIGNING_SECRET`：待真实平台接入
- `XHS_ENTITLEMENT_FIXTURE`：仅开发/测试
- `XHS_FIXTURE_SIGNING_SECRET`：仅开发/测试

不要提交 `.env.local`、平台密钥、订单信息或生产凭据。

## 免费答案继承

免费完成8题后，原始答案按 question ID 存为 `FreeAnswerSnapshot`。当服务端确认 entitlement 并创建新的 Premium attempt 时，8题答案会填入20题对应位置，用户补答12题。没有快照的用户正常完成20题。最终 TYPE 始终由服务端用完整20题重新计算。

## 人格与视觉数据

- 唯一人格内容源：`lib/personalities.ts`
- 固定 ID：`TYPE01–TYPE16`
- 免费预览资源：`public/personality-preview/type01.webp` 至 `type16.webp`
- 完整资源：不放在公开目录，通过授权接口读取
- V2 横向矩阵：`docs/personality-v2-matrix.md`

人格正文、动物映射、评分逻辑与商业授权层相互独立。

## 数据库

应用新环境时先执行基础 schema，再执行：

```text
supabase/migrations/20260810_xhs_native_entitlements.sql
```

迁移新增：

- `premium_entitlements`
- `premium_test_attempts`
- `premium_test_results`
- entitlement 版 attempt RPC

旧 `code_batches`、`redeem_codes`、`redeem_sessions`、`test_attempts`、`test_results` 与旧 RPC 暂时保留，仅用于历史兼容与后续数据审计，运行时代码不再依赖。不要未经单独审核直接 DROP。

## 质量检查

```bash
npm test
npm run typecheck
git diff --check
npm run build
```
