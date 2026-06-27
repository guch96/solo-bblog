import { describe, it, expect } from "vitest";
import {
  getLocalTodayString,
  getLocalDateDaysAgoString,
  formatRecordDateTime,
  formatLocalDateInput,
  normalizeDateTimeLocalValue,
  getCurrentLocalDateTimeString,
} from "@/lib/datetime";

describe("datetime 工具函数", () => {
  describe("getLocalTodayString", () => {
    it("返回当前日期 YYYY-MM-DD 格式", () => {
      const ref = new Date(2026, 5, 27);
      const result = getLocalTodayString(ref);
      expect(result).toBe("2026-06-27");
    });

    it("处理单数月日补零", () => {
      const ref = new Date(2026, 0, 5);
      const result = getLocalTodayString(ref);
      expect(result).toBe("2026-01-05");
    });
  });

  describe("getLocalDateDaysAgoString", () => {
    it("计算 N 天前的日期", () => {
      const ref = new Date(2026, 5, 27);
      expect(getLocalDateDaysAgoString(1, ref)).toBe("2026-06-26");
      expect(getLocalDateDaysAgoString(6, ref)).toBe("2026-06-21");
    });

    it("跨月计算", () => {
      const ref = new Date(2026, 0, 3);
      expect(getLocalDateDaysAgoString(5, ref)).toBe("2025-12-29");
    });
  });

  describe("formatRecordDateTime", () => {
    it("返回中文格式", () => {
      const result = formatRecordDateTime("2026-06-27T10:05:30");
      expect(result).toContain("2026");
      expect(result).toContain("06");
      expect(result).toContain("27");
    });
  });

  describe("formatLocalDateInput", () => {
    it("ISO 转 YYYY-MM-DDTHH:mm", () => {
      expect(formatLocalDateInput("2026-06-27T10:05:00")).toBe("2026-06-27T10:05");
    });

    it("无效日期返回空字符串", () => {
      expect(formatLocalDateInput("")).toBe("");
      expect(formatLocalDateInput("invalid")).toBe("");
    });
  });

  describe("normalizeDateTimeLocalValue", () => {
    it("补全秒数", () => {
      expect(normalizeDateTimeLocalValue("2026-06-27T10:05")).toBe("2026-06-27T10:05:00");
    });

    it("已含秒数不变", () => {
      expect(normalizeDateTimeLocalValue("2026-06-27T10:05:30")).toBe("2026-06-27T10:05:30");
    });

    it("空值原样返回", () => {
      expect(normalizeDateTimeLocalValue("")).toBe("");
    });
  });

  describe("getCurrentLocalDateTimeString", () => {
    it("返回完整时间格式", () => {
      const ref = new Date(2026, 5, 27, 14, 30, 45);
      expect(getCurrentLocalDateTimeString(ref)).toBe("2026-06-27T14:30:45");
    });
  });
});
