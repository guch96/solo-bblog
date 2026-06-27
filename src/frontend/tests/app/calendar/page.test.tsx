import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import CalendarPage from "@/app/calendar/page";
import { renderWithAuth } from "../../helpers/render-utils";
import { resetRecords } from "../../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/calendar" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/calendar";
  });

  it("渲染日历视图标题", async () => {
    renderWithAuth(<CalendarPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("日历视图")).toBeInTheDocument();
    });
  });

  it("渲染 CalendarHeatmap 热力图区域", async () => {
    renderWithAuth(<CalendarPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      // CalendarHeatmap 的 month label 来自当前月份
      expect(screen.getByText("2026年6月")).toBeInTheDocument();
    });
  });
});
