import { describe, it, expect, vi } from "vitest";
import { RECORDS_CHANGED_EVENT, emitRecordsChanged } from "@/lib/records-events";

describe("records-events (事件总线)", () => {
  it("RECORDS_CHANGED_EVENT 常量值为预期字符串", () => {
    expect(RECORDS_CHANGED_EVENT).toBe("pooptracker:records-changed");
  });

  it("emitRecordsChanged 派发 CustomEvent", () => {
    const listener = vi.fn();
    window.addEventListener(RECORDS_CHANGED_EVENT, listener);
    emitRecordsChanged();
    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("pooptracker:records-changed");
    window.removeEventListener(RECORDS_CHANGED_EVENT, listener);
  });

  it("多个监听器同时收到事件", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    window.addEventListener(RECORDS_CHANGED_EVENT, listener1);
    window.addEventListener(RECORDS_CHANGED_EVENT, listener2);
    emitRecordsChanged();
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    window.removeEventListener(RECORDS_CHANGED_EVENT, listener1);
    window.removeEventListener(RECORDS_CHANGED_EVENT, listener2);
  });
});
