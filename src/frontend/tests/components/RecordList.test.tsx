import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import RecordList from "@/components/records/RecordList";
import { seedRecords, resetRecords } from "../mocks/handlers";
import type { RecordData } from "@/lib/types";

// Mock router
const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/records",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock matchMedia for sonner
beforeEach(() => {
  vi.clearAllMocks();
  resetRecords();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("RecordList", () => {
  it("无记录时显示空状态提示", async () => {
    render(<RecordList />);
    await waitFor(() => {
      expect(screen.getByText("暂无符合条件的记录")).toBeInTheDocument();
    });
  });

  it("有记录时渲染记录内容", async () => {
    seedRecords([{
      id: 1, start_time: "2026-06-27T10:00:00", end_time: "2026-06-27T10:05:00",
      duration: 300, shape: "4", color: "brown", smell: "normal",
      comfort: "comfortable", process_feeling: "smooth", notes: "测试记录",
      input_mode: "manual", created_at: "", updated_at: "",
    } as RecordData]);

    render(<RecordList />);

    await waitFor(() => {
      expect(screen.getByText("测试记录")).toBeInTheDocument();
    });
  });

  it("渲染日期筛选快捷按钮", async () => {
    render(<RecordList />);
    await waitFor(() => {
      expect(screen.getByText("今天")).toBeInTheDocument();
      expect(screen.getByText("近7天")).toBeInTheDocument();
      expect(screen.getByText("清空日期")).toBeInTheDocument();
    });
  });
});
