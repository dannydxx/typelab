import { describe, expect, it } from "vitest";
import { PERSONALITIES } from "./personalities";
import { normalizeStoredResult } from "./personality-compat";

describe("formal personality IP system", () => {
  it("keeps sixteen unique animals on stable type ids", () => {
    expect(PERSONALITIES.map((item) => item.id)).toEqual(Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0")));
    expect(PERSONALITIES.map((item) => item.animal)).toEqual([
      "狗", "狐狸", "白鹿", "白猫", "雪豹", "海鸥", "白鹤", "鲸",
      "熊", "兔", "刺猬", "天鹅", "狼", "水獭", "猫头鹰", "乌鸦",
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
    expect(PERSONALITIES.slice(11).map(({ id, name, animal }) => ({ id, name, animal }))).toEqual([
      { id: "12", name: "雨夜天鹅型", animal: "天鹅" },
      { id: "13", name: "琥珀狼型", animal: "狼" },
      { id: "14", name: "极光水獭型", animal: "水獭" },
      { id: "15", name: "雾岛猫头鹰型", animal: "猫头鹰" },
      { id: "16", name: "雪夜乌鸦型", animal: "乌鸦" },
    ]);
  });

  it("migrates legacy name-only local results to stable ids", () => {
    const legacyNames = ["雨夜小鹿型", "琥珀狐狸型", "极光猫型", "雾岛白鲸型", "雪夜黑猫型"];
    expect(legacyNames.map((name) => normalizeStoredResult(JSON.stringify({ personalityName: name }))?.personalityId)).toEqual([
      "12", "13", "14", "15", "16",
    ]);
  });
});
