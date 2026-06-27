import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import EditRecordPage from "@/app/records/[id]/edit/page";
import { renderWithAuth } from "../../../../helpers/render-utils";
import { seedRecords, resetRecords } from "../../../../mocks/handlers";
import type { RecordData } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => "/records/1/edit",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "1" }),
}));

describe("EditRecordPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
  });

  it("编辑模式显示'更新记录'按钮", async () => {
    seedRecords([{
      id: 1, start_time: "2026-06-27T10:00:00", end_time: "2026-06-27T10:05:00",
      duration: 300, shape: "4", color: "brown", smell: "normal",
      comfort: "comfortable", process_feeling: "smooth", notes: "",
      input_mode: "manual", created_at: "", updated_at: "",
    } as RecordData]);

    renderWithAuth(<EditRecordPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("更新记录")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("编辑模式显示'取消'按钮", async () => {
    seedRecords([{
      id: 1, start_time: "2026-06-27T10:00:00", end_time: "2026-06-27T10:05:00",
      duration: 300, shape: "4", color: "brown", smell: "normal",
      comfort: "comfortable", process_feeling: "smooth", notes: "",
      input_mode: "manual", created_at: "", updated_at: "",
    } as RecordData]);

    renderWithAuth(<EditRecordPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("取消")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
