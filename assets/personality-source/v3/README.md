# V3人格视觉源图

本目录保存经人工确认的16张正式动物人格源图，固定命名为 `type01.webp` 至 `type16.webp`。

- 统一尺寸：1600×2000
- 统一比例：4:5
- 不含文字和页面排版
- `assets/personality-premium/` 保存运行时使用的受保护副本
- `public/personality-preview/` 只保存单独生成的低清朦胧预览

替换任意源图后，需要同步更新受保护副本和免费预览，并运行 `lib/personality-visual-assets.test.ts` 检查三套文件是否一致。
