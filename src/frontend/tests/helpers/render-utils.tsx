import { render, type RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/hooks/useAuth";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

interface RenderWithAuthOptions extends Omit<RenderOptions, "wrapper"> {
  token?: string;
}

/** 用 AuthProvider 包裹渲染，支持预设 token */
function renderWithAuth(ui: ReactElement, options?: RenderWithAuthOptions) {
  const { token, ...renderOpts } = options || {};

  if (token) {
    localStorage.setItem("pooptracker_token", token);
  } else {
    localStorage.removeItem("pooptracker_token");
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOpts });
}

/** 创建可控的 mock router */
function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  };
}

/**
 * 更新 next/navigation mock 的返回值，返回新的 router/pathname。
 *
 * 调用前需确保测试文件已通过 vi.mock("next/navigation", ...) 建立 mock，
 * 且 mock 实现应引用以下模块级可变对象：
 *
 *   - navState.pathname  (object with .current: string)
 *   - navState.searchParams  (object with .current: URLSearchParams)
 *
 * 使用方法见 tests/components/BottomNav.test.tsx
 */
function mockNextNavigation(
  navState: { pathname: { current: string }; searchParams: { current: URLSearchParams } },
  overrides: { pathname?: string; searchParams?: URLSearchParams } = {},
) {
  navState.pathname.current = overrides.pathname ?? "/";
  navState.searchParams.current = overrides.searchParams ?? new URLSearchParams();
  const router = createMockRouter();
  return { router, pathname: navState.pathname.current };
}

export { renderWithAuth, createMockRouter, mockNextNavigation };
