import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";
import { renderWithAuth } from "../helpers/render-utils";
import { resetRecords } from "../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/";
  });

  it("渲染标题'健康记录总览'", async () => {
    renderWithAuth(<HomePage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("健康记录总览")).toBeInTheDocument();
    });
  });

  it("渲染 Timer 组件按钮", async () => {
    renderWithAuth(<HomePage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("开始记录")).toBeInTheDocument();
      expect(screen.getByText("手动记录")).toBeInTheDocument();
    });
  });

  it("无今日记录时显示空状态", async () => {
    renderWithAuth(<HomePage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      // "今天还没有记录" 同时在副标题区域和空状态卡片中出现
      const elements = screen.getAllByText("今天还没有记录");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
