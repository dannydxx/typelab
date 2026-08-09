import { describe, expect, it } from "vitest";
import { PERSONALITIES } from "./personalities";
import { normalizeStoredResult } from "./personality-compat";

describe("formal personality IP system", () => {
  it("keeps sixteen unique animals on stable type ids", () => {
    expect(PERSONALITIES.map((item) => item.id)).toEqual(Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0")));
    expect(PERSONALITIES.map(({ id, name, animal }) => ({ id, name, animal }))).toEqual([
      { id: "01", name: "晴岛小狗型", animal: "狗" },
      { id: "02", name: "橘光狐狸型", animal: "狐狸" },
      { id: "03", name: "晚风白鹿型", animal: "白鹿" },
      { id: "04", name: "松林白猫型", animal: "白猫" },
      { id: "05", name: "星轨雪豹型", animal: "雪豹" },
      { id: "06", name: "海盐海鸥型", animal: "海鸥" },
      { id: "07", name: "青山白鹤型", animal: "白鹤" },
      { id: "08", name: "深海鲸歌型", animal: "鲸" },
      { id: "09", name: "蜜糖小熊型", animal: "熊" },
      { id: "10", name: "烟火兔型", animal: "兔" },
      { id: "11", name: "月光刺猬型", animal: "刺猬" },
      { id: "12", name: "雨夜天鹅型", animal: "天鹅" },
      { id: "13", name: "琥珀狼型", animal: "狼" },
      { id: "14", name: "极光水獭型", animal: "水獭" },
      { id: "15", name: "雾岛猫头鹰型", animal: "猫头鹰" },
      { id: "16", name: "雪夜乌鸦型", animal: "乌鸦" },
    ]);
    expect(new Set(PERSONALITIES.map((item) => item.animal)).size).toBe(16);
    expect(PERSONALITIES.map((item) => item.image)).toEqual(
      Array.from({ length: 16 }, (_, index) => `/personality/type${String(index + 1).padStart(2, "0")}.webp`),
    );
  });

  it("preserves the original scoring combination for every stable type", () => {
    expect(PERSONALITIES.map((item) => item.poles.join("/"))).toEqual([
      "stable/close/direct/resolve", "stable/close/direct/calm",
      "stable/close/restrained/resolve", "stable/close/restrained/calm",
      "stable/independent/direct/resolve", "stable/independent/direct/calm",
      "stable/independent/restrained/resolve", "stable/independent/restrained/calm",
      "sensitive/close/direct/resolve", "sensitive/close/direct/calm",
      "sensitive/close/restrained/resolve", "sensitive/close/restrained/calm",
      "sensitive/independent/direct/resolve", "sensitive/independent/direct/calm",
      "sensitive/independent/restrained/resolve", "sensitive/independent/restrained/calm",
    ]);
  });

  it("maps the five updated animals to their original scoring types", () => {
    expect(PERSONALITIES.slice(11).map(({ id, keywords }) => ({ id, keywords }))).toEqual([
      { id: "12", keywords: ["慢热", "犹豫", "优雅", "需要安全感"] },
      { id: "13", keywords: ["敏锐", "独立", "直接", "反差感"] },
      { id: "14", keywords: ["个性", "敏感", "灵动", "表达力"] },
      { id: "15", keywords: ["防御", "深情", "慢热", "观察型"] },
      { id: "16", keywords: ["疏离", "敏锐", "克制", "隐藏情绪"] },
    ]);
  });

  it("migrates legacy name-only local results to stable ids", () => {
    const legacyNames = ["雨夜小鹿型", "琥珀狐狸型", "极光猫型", "雾岛白鲸型", "雪夜黑猫型"];
    expect(legacyNames.map((name) => normalizeStoredResult(JSON.stringify({ personalityName: name }))?.personalityId)).toEqual([
      "12", "13", "14", "15", "16",
    ]);
  });
});
