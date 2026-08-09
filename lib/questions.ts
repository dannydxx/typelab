import type { Question } from "./types";

const options = (labels: [string, string, string, string]) =>
  labels.map((label, index) => ({ label, value: [-2, -1, 1, 2][index] as -2 | -1 | 1 | 2 }));

export const QUESTIONS: Question[] = [
  { id: 1, dimension: "security", prompt: "喜欢的人三个小时没有回复你的消息，你更接近：", options: options(["继续做自己的事情，基本不会多想", "偶尔会看看手机，但不会主动询问", "会开始在意，想发消息确认一下", "会明显焦虑，忍不住反复猜测原因"]) },
  { id: 2, dimension: "security", prompt: "你感觉 TA 今天聊天的语气比平时冷淡：", options: options(["觉得可能只是状态不好", "会注意到，但先观察一下", "会开始回想自己是不是说错了什么", "很难不去想是不是关系发生了变化"]) },
  { id: 3, dimension: "security", prompt: "已经约好的见面被 TA 临时取消：", options: options(["完全能理解，重新约时间即可", "有一点失望，但很快过去", "会有些不安，想知道真正原因", "很容易联想到 TA 是不是没那么想见我"]) },
  { id: 4, dimension: "security", prompt: "TA 以前每天都会说晚安，今天突然没有：", options: options(["完全不会在意", "会注意到，但不会多想", "会觉得有点奇怪", "会明显在意关系是不是哪里出了问题"]) },
  { id: 5, dimension: "security", prompt: "恋爱对象进入一段特别忙碌的时期：", options: options(["我可以很好地安排自己的生活", "偶尔会想念，但可以适应", "如果互动减少，我会有点没有安全感", "长时间得不到回应会让我非常不舒服"]) },
  { id: 6, dimension: "closeness", prompt: "你理想中的恋爱联系频率是：", options: options(["各忙各的，有事再联系", "每天简单联系一下就很好", "喜欢经常分享生活里的小事", "有条件的话，希望随时都可以联系"]) },
  { id: 7, dimension: "closeness", prompt: "恋爱后的周末你更喜欢：", options: options(["双方都有自己的安排", "见一面，其余时间各自生活", "大部分时间一起度过", "只要有时间就想待在一起"]) },
  { id: 8, dimension: "closeness", prompt: "发生一件特别开心的事情时：", options: options(["我通常先自己享受这件事", "之后聊天的时候再告诉 TA", "会第一时间想发消息告诉 TA", "会马上想视频、打电话甚至见 TA"]) },
  { id: 9, dimension: "closeness", prompt: "做重要决定的时候：", options: options(["我更习惯自己思考和决定", "特别重要的事情才会和伴侣讨论", "多数重要事情都希望一起商量", "我很希望伴侣深度参与我的生活决定"]) },
  { id: 10, dimension: "closeness", prompt: "如果需要长期异地：", options: options(["反而会觉得彼此都有空间", "只要感情稳定，我可以适应", "会明显觉得缺少陪伴", "长期见不到对方会让我很难接受"]) },
  { id: 11, dimension: "expression", prompt: "当你确定自己喜欢一个人：", options: options(["通常会把感情藏起来", "会通过一些小动作暗示", "会主动释放比较明确的信号", "我愿意很直接地告诉 TA"]) },
  { id: 12, dimension: "expression", prompt: "当你因为某件事情吃醋：", options: options(["通常不会说出来", "可能会用一点暗示表达", "会告诉 TA 我为什么不舒服", "会直接把感受和边界讲清楚"]) },
  { id: 13, dimension: "expression", prompt: "当你非常想念对方：", options: options(["想念归想念，不一定会说", "通常会等 TA 先联系", "会主动告诉 TA“我想你了”", "会直接提出见面、通话或者视频"]) },
  { id: 14, dimension: "expression", prompt: "关系中有什么事情让你不舒服：", options: options(["习惯先自己消化", "等情绪过去以后再看有没有必要说", "会找机会把感受告诉 TA", "通常会尽快把需求明确说出来"]) },
  { id: 15, dimension: "expression", prompt: "你很喜欢伴侣某个地方时：", options: options(["我心里知道就好", "偶尔会说一句", "经常会主动表达欣赏", "我会很具体、很直接地夸 TA"]) },
  { id: 16, dimension: "conflict", prompt: "两个人刚刚发生争执：", options: options(["我希望先自己待很久", "需要先冷静一段时间", "希望当天可以聊清楚", "我很难带着问题离开，想马上说清楚"]) },
  { id: 17, dimension: "conflict", prompt: "自己情绪特别重的时候：", options: options(["我会完全暂停交流", "先自己缓一缓再沟通", "短暂整理一下就会回来谈", "即使有情绪，我也倾向于边说边解决"]) },
  { id: 18, dimension: "conflict", prompt: "发现彼此之间出现一个误会：", options: options(["如果不严重，可能让它自然过去", "等气氛合适时再解释", "会尽快找机会说明", "会立即澄清，不喜欢误会继续存在"]) },
  { id: 19, dimension: "conflict", prompt: "发生矛盾以后，对方突然沉默：", options: options(["我不会追问，等 TA 愿意说", "会先给 TA 一些空间", "过一会儿会主动问问情况", "我会很想马上知道问题到底是什么"]) },
  { id: 20, dimension: "conflict", prompt: "一次冲突结束以后：", options: options(["通常等对方先恢复联系", "可能第二天再慢慢恢复", "当天会主动尝试修复关系", "会尽快通过聊天、拥抱或表达完成修复"]) },
];
