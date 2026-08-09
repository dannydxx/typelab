# 免费版与完整版产品架构

## 路由结构

```text
/
└── 自动转到 /premium（兼容原销售网址）

/free
├── /free/test       8题免费测试
├── /free/result     初步人格结果
└── /free/unlock     完整版购买引导

/premium
├── /premium/test    20题完整测试
└── /premium/result  完整报告与高清分享卡

/admin               管理员后台
/api                 兑换、完成计数与后台安全接口
```

旧的 `/test` 与 `/result` 会自动转到对应的 `/premium` 路由，不会破坏已有浏览器收藏或旧链接。

## 共享资源

```text
lib/questions.ts             唯一20题题库
lib/free-questions.ts        只保存免费版选中的8个题号
lib/personalities.ts         唯一16人格数据、配色、图片路径与完整报告
lib/scoring.ts               两个版本共用的维度计分与人格映射
components/questionnaire.tsx 两个版本共用的答题界面
components/personality-visual.tsx 共用人格图片与缺图占位
components/result-reveal.tsx 共用人格揭晓界面
components/dimension-scale.tsx 完整版维度坐标
lib/share-card.ts            完整版高清分享卡
public/personality/          两个版本共用的16张人格图片
```

## 状态隔离

免费版使用 `love_free_*` localStorage 键，只保存免费答题进度和初步结果。

完整版使用 `love_*` 键，并额外要求有效兑换会话和服务端 attempt。免费版状态无法开启 `/premium/test`，也无法查看 `/premium/result`。

## 内容维护

- 修改题目：编辑 `lib/questions.ts`。免费版会自动读取相同题目。
- 调整免费8题选择：只修改 `lib/free-questions.ts` 的题号。
- 修改人格名称、关键词、颜色和报告：编辑 `lib/personalities.ts`。
- 替换人格图片：替换 `public/personality/type01.webp` 至 `type16.webp`。
- 修改品牌、账号、购买链接及模式开关：编辑 `lib/config.ts`。

## 部署

这是同一个 Next.js 应用，不是两套部署。按主 README 部署一次到 Vercel 后，`https://domain.com/free` 和 `https://domain.com/premium` 会同时可用。
