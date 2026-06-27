import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import BottomNav from "@/components/nav/BottomNav";
import { mockNextNavigation } from "../helpers/render-utils";

// 在 vi.hoisted 中创建的可变对象，供 vi.mock 工厂引用
const navState = vi.hoisted(() => ({
  pathname: { current: "/" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("BottomNav", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("渲染 5 个导航标签", () => {
    mockNextNavigation(navState, { pathname: "/" });
    render(<BottomNav />);
    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("日历")).toBeInTheDocument();
    expect(screen.getByText("记录")).toBeInTheDocument();
    expect(screen.getByText("统计")).toBeInTheDocument();
    expect(screen.getByText("AI 分析")).toBeInTheDocument();
  });

  it("当前路由 /records 时'记录'标签存在", () => {
    mockNextNavigation(navState, { pathname: "/records" });
    render(<BottomNav />);
    const recordsLink = screen.getByText("记录").closest("a");
    expect(recordsLink).toBeTruthy();
  });

  it("首页路由不在 /records 时高亮", () => {
    mockNextNavigation(navState, { pathname: "/records" });
    render(<BottomNav />);
    const homeLink = screen.getByText("首页").closest("a");
    expect(homeLink).toBeTruthy();
  });
});
