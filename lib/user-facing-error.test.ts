import { describe, expect, it } from "vitest";
import { getUserFacingError } from "./user-facing-error";

describe("user-facing errors", () => {
  it("translates browser network errors into Chinese", () => {
    expect(getUserFacingError(new TypeError("Failed to fetch"), "请求失败。"))
      .toBe("无法连接服务，请确认网络和本地测试服务正常后重试。");
  });

  it("keeps Chinese API messages", () => {
    expect(getUserFacingError(new Error("当前账号暂无完整版访问权限。"), "请求失败。"))
      .toBe("当前账号暂无完整版访问权限。");
  });

  it("hides technical English errors behind the supplied fallback", () => {
    expect(getUserFacingError(new Error("SUPABASE_SERVER_NOT_CONFIGURED"), "服务暂时不可用。"))
      .toBe("服务暂时不可用。");
  });
});
