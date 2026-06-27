import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import AuthGuard from "@/components/AuthGuard";
import { renderWithAuth, mockNextNavigation } from "../helpers/render-utils";

const navState = vi.hoisted(() => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  };
  return {
    pathname: { current: "/" },
    searchParams: { current: new URLSearchParams() },
    router,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => navState.router,
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // 模拟 window.matchMedia 以支持 sonner 的 Toaster 组件
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

  it("未认证且非登录页 → 跳转到 /login", async () => {
    mockNextNavigation(navState, { pathname: "/" });
    renderWithAuth(<AuthGuard><div>受保护内容</div></AuthGuard>);
    await vi.waitFor(() => {
      expect(navState.router.replace).toHaveBeenCalledWith("/login");
    }, { timeout: 3000 });
  });

  it("已认证且非登录页 → 渲染子组件", async () => {
    mockNextNavigation(navState, { pathname: "/records" });
    renderWithAuth(<AuthGuard><div>记录页面内容</div></AuthGuard>, { token: "mock-jwt-token-123" });
    const content = await screen.findByText("记录页面内容", {}, { timeout: 3000 });
    expect(content).toBeInTheDocument();
  });

  it("已认证且在登录页 → 跳转到 /", async () => {
    mockNextNavigation(navState, { pathname: "/login" });
    renderWithAuth(<AuthGuard><div>登录页</div></AuthGuard>, { token: "mock-jwt-token-123" });
    await vi.waitFor(() => {
      expect(navState.router.replace).toHaveBeenCalledWith("/");
    }, { timeout: 3000 });
  });

  it("登录页未认证 → 渲染登录页内容", async () => {
    mockNextNavigation(navState, { pathname: "/login" });
    renderWithAuth(<AuthGuard><div>登录表单</div></AuthGuard>);
    const form = await screen.findByText("登录表单", {}, { timeout: 3000 });
    expect(form).toBeInTheDocument();
  });
});
