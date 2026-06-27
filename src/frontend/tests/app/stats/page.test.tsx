import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import StatsPage from "@/app/stats/page";
import { renderWithAuth } from "../../helpers/render-utils";
import { resetRecords } from "../../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/stats" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("StatsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/stats";
  });

  it("渲染数据统计标题", async () => {
    renderWithAuth(<StatsPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("数据统计")).toBeInTheDocument();
    });
  });

  it("渲染统计范围选择器", async () => {
    renderWithAuth(<StatsPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("7 天")).toBeInTheDocument();
    });
  });
});
