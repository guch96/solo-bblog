import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";
import { renderWithAuth } from "../../helpers/render-utils";

// 顶层 vi.mock 供 LoginPage 中的 useRouter 使用
const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("渲染表单：用户名输入、密码输入、登录按钮", () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登 录" })).toBeInTheDocument();
  });

  it("空表单提交显示校验提示", async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "登 录" }));

    // 前端校验阻止提交，表单仍存在
    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
    // 验证 router.push 未被调用（未登录成功）
    expect(router.push).not.toHaveBeenCalled();
  });

  it("填写用户名密码后点击登录 → 跳转到首页", async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);

    await user.type(screen.getByPlaceholderText("请输入用户名"), "user1");
    await user.type(screen.getByPlaceholderText("请输入密码"), "123456");
    await user.click(screen.getByRole("button", { name: "登 录" }));

    // 登录成功后 router.push("/") 会被调用
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/");
    }, { timeout: 3000 });
  });
});
