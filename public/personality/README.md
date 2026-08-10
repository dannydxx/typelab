# 人格视觉旧路径说明

`lib/personalities.ts` 中的 `image` 字段仍保留本目录路径，作为冻结数据与旧分享逻辑的兼容字段。

不要把付费完整版高清原图放在本目录。`public/` 中的文件知道URL后即可直接访问，无法构成Premium权限边界。

新视觉资产请使用：

- 免费局部预览：`public/personality-preview/type01.webp` 至 `type16.webp`
- Premium完整原图：`assets/personality-premium/type01.webp` 至 `type16.webp`

Premium结果页通过受HttpOnly会话保护的接口读取完整图；当前资产缺失时继续显示艺术占位。

## 正式动物映射（文件名保持一致）

| 图片 | TYPE | 人格 | 动物 |
| --- | --- | --- | --- |
| `type01.webp` | 01 | 晴岛小狗型 | 狗 |
| `type02.webp` | 02 | 橘光狐狸型 | 狐狸 |
| `type03.webp` | 03 | 晚风白鹿型 | 白鹿 |
| `type04.webp` | 04 | 松林白猫型 | 白猫 |
| `type05.webp` | 05 | 星轨雪豹型 | 雪豹 |
| `type06.webp` | 06 | 海盐海鸥型 | 海鸥 |
| `type07.webp` | 07 | 青山白鹤型 | 白鹤 |
| `type08.webp` | 08 | 深海鲸歌型 | 鲸 |
| `type09.webp` | 09 | 蜜糖小熊型 | 熊 |
| `type10.webp` | 10 | 烟火兔型 | 兔 |
| `type11.webp` | 11 | 月光刺猬型 | 刺猬 |
| `type12.webp` | 12 | 雨夜天鹅型 | 天鹅 |
| `type13.webp` | 13 | 琥珀狼型 | 狼 |
| `type14.webp` | 14 | 极光水獭型 | 水獭 |
| `type15.webp` | 15 | 雾岛猫头鹰型 | 猫头鹰 |
| `type16.webp` | 16 | 雪夜乌鸦型 | 乌鸦 |

当前16张正式动物图片均尚未提供。放入图片前，免费与Premium会分别显示局部预览占位和完整揭晓占位。
