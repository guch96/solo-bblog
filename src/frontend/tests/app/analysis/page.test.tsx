import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import AnalysisPage from "@/app/analysis/page";
import { renderWithAuth } from "../../helpers/render-utils";
import { resetRecords } from "../../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/analysis" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("AnalysisPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/analysis";
  });

  it("渲染'AI 健康分析'标题", async () => {
    renderWithAuth(<AnalysisPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("AI 健康分析")).toBeInTheDocument();
    });
  });

  it("渲染时间范围快捷按钮", async () => {
    renderWithAuth(<AnalysisPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("今天")).toBeInTheDocument();
      expect(screen.getByText("近7天")).toBeInTheDocument();
      expect(screen.getByText("近14天")).toBeInTheDocument();
      expect(screen.getByText("近30天")).toBeInTheDocument();
    });
  });

  it("渲染'开始分析'按钮", async () => {
    renderWithAuth(<AnalysisPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("开始分析")).toBeInTheDocument();
    });
  });

  it("渲染'历史分析'区域标题", async () => {
    renderWithAuth(<AnalysisPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("历史分析")).toBeInTheDocument();
    });
  });
});
