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
function createMockRouter(overrides: { pathname?: string } = {}) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  };
}

/** Mock next/navigation 并返回可控 router */
function mockNextNavigation(overrides: { pathname?: string; searchParams?: URLSearchParams } = {}) {
  const router = createMockRouter(overrides);
  const pathname = overrides.pathname || "/";

  vi.mock("next/navigation", () => ({
    useRouter: () => router,
    usePathname: () => pathname,
    useSearchParams: () => overrides.searchParams || new URLSearchParams(),
  }));

  return { router, pathname };
}

export { renderWithAuth, createMockRouter, mockNextNavigation };
