# 产品架构

## 用户路径

```text
公开入口 → 免费8题 → 初步人格 → 免费分享
                           ↓
                小红书外部交易与自动发货
                           ↓
             固定测试URL + 唯一Access Code
                           ↓
       HttpOnly Access Session → Premium 20题
                           ↓
                  正式报告 → 高清人格卡
```

小红书与第三方自动发货插件负责商品、价格、订单、支付及交易后交付；本应用只负责 Access Code 库存和验证、Premium 测试、正式结果与分享。

## 授权边界

- `Access Code`：交易后交付凭证。数据库仅保存安全摘要。
- `Access Session`：服务端验证成功后建立的 HttpOnly 会话；未完成测试时受72小时测试窗口限制，生成结果后延长到30天只读查看窗口。
- `Premium Access`：独立验证 session、code、attempt、result 的归属关系。
- `Portrait`：还要求请求 TYPE 与正式结果 TYPE 完全一致。
- 客户端 storage、query、header 和免费结果均不能授予 Premium 权限。

## 一码一结果

每个 Access Code 最多绑定一个 `test_attempts` 记录和一个 `test_results` 记录。未开始时创建 attempt，进行中恢复原 attempt，已完成时恢复原 result，不创建新的正式测试。免费8题答案只作为新 attempt 的预填数据，不参与服务端授权。

## 数据库存储

V3.6 增量迁移（历史，已归档）：`supabase/archive/20260811_external_access_codes.sql`。当前 ACTIVE schema 由 `supabase/migrations/20260817000001_typelab_clean_base.sql` 及其两个 fix migration 定义。

新增：

- `access_code_batches`
- `access_codes`
- `access_sessions`
- `activate_access_code`
- `start_access_test_attempt`
- `complete_access_test_attempt`

现有 `test_attempts` 和 `test_results` 继续作为正式业务数据表，通过新增的 `access_code_id` 与凭证关联。旧 XHS entitlement 和旧 credential 对象不 DROP，只退出当前运行路径。

## 明文库存原则

后台生成批次时使用密码学安全随机源。明文仅随生成响应一次性下载为 CSV/TXT；数据库只保存 HMAC 摘要，之后无法重新读取或重新导出同一批明文。

## 期限规则

- 首次激活后72小时内可以开始、继续并完成唯一正式测试。
- 正式结果生成后30天内只允许查看同一结果、保存人格图和分享卡。
- 结果查看期不能创建新 attempt 或生成第二个 TYPE。
- 期限结束后不再访问 Premium 内容，但结果数据不删除。

## 上线安全

- `/api/access/activate` 使用数据库原子限流，客户端 IP 仅以独立 HMAC 摘要保存。
- 不存在、已撤销和已过期访问码返回同一用户提示。
- 并发激活通过行锁及单 Session 唯一约束收敛到同一个 Access 身份。
- 明文导出失败时，管理员可整批撤销 `UNUSED` 库存；`ACTIVE` 买家不受影响。
