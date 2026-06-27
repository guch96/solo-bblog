import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import DesktopNav from "@/components/nav/DesktopNav";
import { renderWithAuth } from "../helpers/render-utils";

// hoisted to top by vitest: DesktopNav imports next/navigation, gets mock
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("DesktopNav", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("已认证时显示用户名", async () => {
    renderWithAuth(<DesktopNav />, { token: "mock-jwt-token-123" });
    const username = await screen.findByText("user1", {}, { timeout: 3000 });
    expect(username).toBeInTheDocument();
  });

  it("渲染 5 个导航链接", async () => {
    renderWithAuth(<DesktopNav />, { token: "mock-jwt-token-123" });
    await screen.findByText("user1", {}, { timeout: 3000 });
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("日历")).toBeInTheDocument();
    expect(screen.getByText("记录")).toBeInTheDocument();
    expect(screen.getByText("统计")).toBeInTheDocument();
    expect(screen.getByText("AI 分析")).toBeInTheDocument();
  });
});
