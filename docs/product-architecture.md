# 产品架构

## 用户路径

```text
公开入口 → 免费8题 → 初步人格 → 免费分享
                           ↓
                  小红书平台商品权益
                           ↓
             Premium 20题 → 正式报告 → 高清人格卡
```

小红书负责商品、价格、订单和支付；本应用只验证 Premium entitlement，并保护测试、结果与正式人格视觉。

## 授权边界

- 客户端：只读取脱敏的 `PremiumAccessState`。
- Provider：业务层只理解 `entitled`，不理解平台订单字段。
- Adapter：`lib/server/xhs-entitlement.ts` 是未来 XHS 身份与订单验证的唯一接入点。
- Data ownership：attempt/result 归属于服务端验证后的 entitlement 与 platform user。
- Portrait：同时要求有效 entitlement、已完成正式测试、请求 TYPE 与正式 TYPE 一致。

## 当前平台状态

`PENDING_XHS_PLATFORM_INTEGRATION`

当前尚无 XHS openId/unionId/platformUserId 登录上下文，也没有官方订单查询、签名回调或商品权益同步。生产环境因此默认拒绝 Premium。开发和测试只能通过服务端环境变量 fixture 模拟，不能通过 localStorage 授权。

## 数据库迁移

`supabase/migrations/20260810_xhs_native_entitlements.sql` 采用纯新增策略，不删除旧表。以下表已弃用但暂未物理删除：

- `code_batches`
- `redeem_codes`
- `redeem_sessions`
- `test_attempts`
- `test_results`

物理清理需要单独的数据保留、历史统计和回滚评估。
