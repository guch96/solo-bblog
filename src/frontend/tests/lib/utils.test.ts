import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className 合并工具)", () => {
  it("合并多个类名", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("过滤 falsy 值", () => {
    expect(cn("base", false && "hidden", undefined, null, "")).toBe("base");
  });

  it("tailwind-merge 冲突类名后者覆盖前者", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("条件类名（clsx 语法）", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("空输入返回空字符串", () => {
    expect(cn()).toBe("");
  });
});
