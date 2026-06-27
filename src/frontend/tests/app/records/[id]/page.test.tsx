import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import RecordDetailPage from "@/app/records/[id]/page";
import { renderWithAuth } from "../../../helpers/render-utils";
import { seedRecords, resetRecords } from "../../../mocks/handlers";
import type { RecordData } from "@/lib/types";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/records/1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "1" }),
}));

describe("RecordDetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
  });

  it("加载并显示记录详情", async () => {
    seedRecords([{
      id: 1, start_time: "2026-06-27T10:00:00", end_time: "2026-06-27T10:05:00",
      duration: 300, shape: "4", color: "brown", smell: "normal",
      comfort: "comfortable", process_feeling: "smooth", notes: "详情测试",
      input_mode: "manual", created_at: "", updated_at: "",
    } as RecordData]);

    renderWithAuth(<RecordDetailPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("详情测试")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("显示编辑和删除按钮", async () => {
    seedRecords([{
      id: 1, start_time: "2026-06-27T10:00:00", end_time: "2026-06-27T10:05:00",
      duration: 300, shape: "4", color: "brown", smell: "normal",
      comfort: "comfortable", process_feeling: "smooth", notes: "按钮测试",
      input_mode: "manual", created_at: "", updated_at: "",
    } as RecordData]);

    renderWithAuth(<RecordDetailPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("编辑")).toBeInTheDocument();
      expect(screen.getByText("删除")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
