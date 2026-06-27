import { describe, it, expect, beforeEach } from "vitest";
import { recordsApi, analysesApi } from "@/lib/api";
import { seedRecords, resetRecords } from "../mocks/handlers";
import type { RecordData } from "@/lib/types";

function setToken() {
  localStorage.setItem("pooptracker_token", "mock-jwt-token-123");
}

describe("recordsApi", () => {
  beforeEach(() => {
    resetRecords();
    setToken();
  });

  it("list() 返回记录列表", async () => {
    seedRecords([
      { id: 1, start_time: "2026-06-27T10:00:00" } as RecordData,
      { id: 2, start_time: "2026-06-27T14:00:00" } as RecordData,
    ]);
    const result = await recordsApi.list();
    expect(result).toHaveLength(2);
  });

  it("list() 支持日期筛选", async () => {
    seedRecords([
      { id: 1, start_time: "2026-06-27T10:00:00" } as RecordData,
      { id: 2, start_time: "2026-06-20T10:00:00" } as RecordData,
    ]);
    const result = await recordsApi.list({ date_from: "2026-06-27", date_to: "2026-06-27" });
    expect(result).toHaveLength(1);
  });

  it("get() 返回单条记录", async () => {
    seedRecords([{ id: 42, start_time: "2026-06-27T10:00:00", shape: "4" } as RecordData]);
    const result = await recordsApi.get(42);
    expect(result.id).toBe(42);
    expect(result.shape).toBe("4");
  });

  it("get() 不存在记录抛出错误", async () => {
    await expect(recordsApi.get(999)).rejects.toThrow();
  });

  it("create() 创建新记录", async () => {
    const result = await recordsApi.create({
      start_time: "2026-06-27T12:00:00",
      input_mode: "manual",
    });
    expect(result.id).toBeDefined();
    expect(result.input_mode).toBe("manual");
  });

  it("update() 更新记录", async () => {
    seedRecords([{ id: 1, start_time: "old", notes: null } as unknown as RecordData]);
    const result = await recordsApi.update(1, { notes: "已更新" });
    expect(result.notes).toBe("已更新");
  });

  it("delete() 删除记录返回 undefined (204)", async () => {
    seedRecords([{ id: 1, start_time: "x" } as RecordData]);
    const result = await recordsApi.delete(1);
    expect(result).toBeUndefined();
  });

  it("calendar() 返回日历数据", async () => {
    const result = await recordsApi.calendar("2026-06");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("stats() 返回统计数据", async () => {
    const result = await recordsApi.stats(7);
    expect(result.summary).toBeDefined();
    expect(result.frequency).toBeDefined();
  });
});

describe("analysesApi", () => {
  beforeEach(() => {
    setToken();
  });

  it("create() 触发分析并返回结果", async () => {
    const result = await analysesApi.create({
      date_from: "2026-06-20",
      date_to: "2026-06-27",
    });
    expect(result.summary).toBeDefined();
    expect(result.provider).toBe("TestProvider");
  });

  it("list() 返回分析列表", async () => {
    const result = await analysesApi.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("get() 返回单条分析", async () => {
    const result = await analysesApi.get(1);
    expect(result.id).toBe(1);
  });
});
