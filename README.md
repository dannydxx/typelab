# 16型恋爱人格测试

这是一个可以用于小红书引流与虚拟商品销售的中文移动端 H5 产品，包含两个独立入口：无需兑换码的8题免费体验版，以及兑换后完成20题、获得完整报告和1080×1440人格分享卡的付费完整版。

项目包含用户测试、24 小时兑换会话、最多 3 次完整测试、断点恢复、幂等完成计数、卡密批量生成与 CSV 导出、管理员查询操作、匿名人格统计，以及完整 Supabase 数据库安全策略。

## 1. 需要安装什么

请先安装：

1. [Node.js](https://nodejs.org/) 20 或更高版本。
2. 一个代码编辑器，推荐 Visual Studio Code。
3. 注册 [Supabase](https://supabase.com/) 账户。
4. 注册 [Vercel](https://vercel.com/) 账户。

不需要自己安装 PostgreSQL，数据库由 Supabase 托管。

## 2. 在电脑上运行

在项目目录打开终端，依次运行：

```bash
npm install
cp .env.example .env.local
npm run dev
```

浏览器打开：

- 免费体验版：`http://localhost:3000/free`
- 付费完整版：`http://localhost:3000/premium`
- 根路径：`http://localhost:3000`，为兼容旧销售链接，会自动进入完整版。

免费版不依赖 Supabase，可以立即完成8题和查看初步结果。完整版真实兑换需要完成下面的 Supabase 配置。

如果只是先在本地验收完整流程，点击首页“开始测试”，再点击页面显示的本地验收码 `LOVE-DEMV-2626`。该通道只在 `npm run dev` 时生效，生产构建不会接受此码。

## 免费版与完整版

| 能力 | 免费体验版 `/free` | 付费完整版 `/premium` |
| --- | --- | --- |
| 使用门槛 | 无需兑换码 | 必须通过兑换码验证 |
| 题目 | 从唯一题库精选8题 | 完整20题 |
| 结果 | 人格名称、缩略图、一句话、4个关键词 | 完整四维坐标、7段报告与建议 |
| 分享卡 | 不提供高清分享卡 | 1080×1440高清人格卡 |
| 目标 | 快速体验与购买转化 | 深度报告与收藏价值 |

两者共享 [`lib/questions.ts`](lib/questions.ts)、[`lib/personalities.ts`](lib/personalities.ts)、评分逻辑、人格图片与通用组件。免费题目只在 [`lib/free-questions.ts`](lib/free-questions.ts) 中按题号选择，不复制题目文案。

功能开关位于 [`lib/config.ts`](lib/config.ts)：

```ts
FREE_MODE = true
PREMIUM_MODE = true
```

购买页展示的小红书账号和购买链接也在这个文件中配置。`purchaseUrl` 为空时显示账号搜索指引；填入商品链接后会显示“前往小红书购买”按钮。

## 3. 创建 Supabase 项目

1. 登录 Supabase，点击 `New project`。
2. 填写项目名称并设置一个强数据库密码，请妥善保存。
3. 区域选择尽量靠近主要用户的节点。
4. 等待项目创建完成。

## 4. 建立数据库

1. 在 Supabase 左侧打开 `SQL Editor`。
2. 点击 `New query`。
3. 打开项目中的 [`supabase/schema.sql`](supabase/schema.sql)，复制全部内容。
4. 粘贴到 SQL Editor，点击 `Run`。
5. 看到成功提示后，数据库表、索引、唯一约束、RLS、幂等函数和统计视图都已创建，不需要自行补 SQL。

业务表默认不允许浏览器中的 `anon` 或普通登录用户读取。兑换、计数和管理操作全部经服务端完成。

## 5. 填写环境变量

在 Supabase 左侧打开 `Project Settings → API`，找到 Project URL、anon/public key 和 service_role key。

编辑本地 `.env.local`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=你的Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon public key
SUPABASE_SERVICE_ROLE_KEY=你的service_role key
ADMIN_EMAIL=你的管理员邮箱
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`service_role` 拥有最高数据库权限。不要发给别人，不要放进截图，不要写成 `NEXT_PUBLIC_` 开头，也不要提交 `.env.local` 到 GitHub。本项目的 `.gitignore` 已默认忽略它。

## 6. 创建管理员账户

1. 在 Supabase 左侧打开 `Authentication → Users`。
2. 点击 `Add user → Create new user`。
3. 输入管理员邮箱和强密码，勾选自动确认邮箱。
4. 复制新用户的 UUID。
5. 打开 SQL Editor，运行下面语句，把 UUID 替换成刚复制的值：

```sql
insert into public.admin_profiles (id)
values ('这里替换为管理员用户UUID');
```

现在访问 `http://localhost:3000/admin`，使用该邮箱和密码登录。只有同时存在于 Supabase Auth 和 `admin_profiles` 的账户才能查看后台数据。

## 7. 生成第一批兑换码

1. 登录 `/admin`。
2. 在“生成与导出”区域选择 10、50、100、500 或 1000。
3. 点击“生成兑换码”。
4. 系统会建立类似 `20260809-001` 的批次，并生成不可预测的 `LOVE-XXXX-XXXX` 兑换码。

字符池排除了 `O、0、I、1、L`，数据库对 `code` 设置了 unique 约束。

## 8. 导出 CSV 并导入自动发货工具

后台提供两种导出：

- “导出 CSV”：只有 `code` 一列。
- “导出带商品名”：包含 `code,product` 两列。

导出只会写入 `exported_at`，不会把卡密标记成已使用。把下载的 CSV 导入你的小红书第三方虚拟商品自动发货工具，并配置固定测试网址即可。本网站不需要连接小红书订单 API。

## 9. 兑换规则

- 新码为 `unused`。
- 第一次验证成功后变为 `active`，从当时起 24 小时有效。
- 有效期内最多成功完成 3 次完整测试。
- 页面刷新不会增加次数；只有一个新的 attempt 第一次成功生成结果时才会原子计数。
- 次数用完后不能开始新测试，但重新输入原码仍可查看最近一次结果。
- 浏览器 localStorage 只用于恢复进度，最终权限由数据库判断。

## 10. 修改品牌名、小红书账号和规则

打开 [`lib/config.ts`](lib/config.ts)，集中修改：

- `brandName`
- `testName`
- `xhsAccount`
- `redeemValidHours`
- `maxCompletedTests`
- `showQrCode`

如果修改兑换有效小时数或最大次数，请同时评估已有卡密。已生成卡密的 `max_completed_count` 已保存在数据库，不会自动跟随配置变化。

## 11. 修改测试题

20 道题全部在 [`lib/questions.ts`](lib/questions.ts)。每个维度必须保持 5 题，每题四个分值必须是 `-2、-1、+1、+2`。不要把分值显示给用户。

修改后运行：

```bash
npm test
npm run typecheck
```

确保 16 种组合仍能全部命中。

## 12. 修改 16 人格文案与颜色

全部人格资料在 [`lib/personalities.ts`](lib/personalities.ts)。每种人格包含名称、关键词、一句话、四维组合、颜色、视觉关键词和七段独立报告。

不要改变 `id` 的 `01—16` 对应关系，除非也同步迁移数据库中的历史 `personality_type`。

## 13. 替换 16 张 AI 人格图片

1. 准备统一 4:5 比例的 WebP 图片。
2. 依次命名为 `type01.webp`、`type02.webp`……`type16.webp`。
3. 放入 `public/personality/`。
4. 重新打开结果页确认主体没有被裁切。

图片不存在时会自动显示对应配色的高级艺术占位。详细要求见 [`public/personality/README.md`](public/personality/README.md)。

## 14. 分享卡与二维码

分享卡由浏览器 Canvas 生成，尺寸 1080×1440，不包含兑换码或用户答案。默认不显示二维码。若未来要启用，在 [`lib/config.ts`](lib/config.ts) 把 `showQrCode` 改为 `true`，同时把 `NEXT_PUBLIC_SITE_URL` 设置为正式域名。

在 iPhone Safari、小红书或微信内置浏览器中，如果没有自动下载，请提示用户长按生成的图片保存；不同内置浏览器会限制自动下载行为。

## 15. 部署到 Vercel

1. 把项目提交到你自己的 GitHub 私有仓库。
2. 登录 Vercel，点击 `Add New → Project`，选择该仓库。
3. Framework Preset 保持 `Next.js`，无需修改构建命令。
4. 在 Vercel 项目 `Settings → Environment Variables` 添加 `.env.local` 中的五个变量。
5. `NEXT_PUBLIC_SITE_URL` 填写正式网址，例如 `https://love.example.com`。
6. 点击 Deploy。
7. 部署完成后重新部署一次，确保所有 `NEXT_PUBLIC_` 值进入正式构建。

不要把 service_role key 填到任何带 `NEXT_PUBLIC_` 的变量中。

## 16. 绑定自己的域名

1. 在 Vercel 项目打开 `Settings → Domains`。
2. 输入自己的域名或子域名。
3. 按 Vercel 提示，在域名服务商处添加 A 或 CNAME 记录。
4. 等待 HTTPS 生效。
5. 把 Vercel 中的 `NEXT_PUBLIC_SITE_URL` 更新为该 HTTPS 域名并重新部署。
6. 将这个固定网址填写到自动发货工具。

## 17. 修改分享信息

网页标题、描述与 Open Graph 信息在 [`app/layout.tsx`](app/layout.tsx)。分享封面由 `/og-cover.jpg` 动态生成。如需替换成静态封面，可以删除 `app/og-cover.jpg/`，再把自己的 `1200×630` 图片放入 `public/og-cover.jpg`。

## 18. 备份数据库

最简单的个人创业备份方式：

1. 定期在 Supabase `Table Editor` 中分别打开 `code_batches`、`redeem_codes` 和 `test_results`。
2. 使用右上角导出功能保存 CSV 到安全位置。
3. 在正式大批量售卖前额外导出一次卡密表。
4. Supabase Pro 用户可在 `Project Settings → Database → Backups` 查看自动备份。
5. service_role key 和数据库密码要保存在密码管理器中，不要和 CSV 放在同一个公开网盘。

## 19. 上线前检查

```bash
npm test
npm run typecheck
npm run build
```

然后用真实 Supabase 测试码检查：不存在、首次激活、24 小时过期、3 次限制、刷新幂等、修改答案、断点恢复、16 型命中、图片缺失占位、分享卡中文、CSV、管理员权限，以及 375/390/430px 三种宽度。

本测试不收集姓名、手机号、微信、生日或精确地址；数据库只保存人格类型、四维分数、完成时间和兑换码关联，不保存 20 道具体答案。
