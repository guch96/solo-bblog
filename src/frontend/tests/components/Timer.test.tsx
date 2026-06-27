import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import Timer from "@/components/timer/Timer";

// 顶层 vi.mock 确保在 Timer 导入前被 hoisted 拦截 next/navigation
const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初始状态显示开始按钮和 00:00", () => {
    render(<Timer />);
    expect(screen.getByText("开始记录")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("准备开始记录")).toBeInTheDocument();
  });

  it("点击开始后显示计时和停止按钮", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timer />);
    await user.click(screen.getByText("开始记录"));
    expect(screen.getByText("停止记录")).toBeInTheDocument();
    expect(screen.getByText("正在记录中...")).toBeInTheDocument();
  });

  it("计时器运行 3 秒后显示 00:03", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timer />);
    await user.click(screen.getByText("开始记录"));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText("00:03")).toBeInTheDocument();
  });

  it("停止后调用 router.push 并携带计时参数", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Timer />);
    await user.click(screen.getByText("开始记录"));
    act(() => { vi.advanceTimersByTime(5000); });
    await user.click(screen.getByText("停止记录"));
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    const pushArg = mockRouter.push.mock.calls[0][0] as string;
    expect(pushArg).toContain("/records/new?");
    expect(pushArg).toContain("input_mode=timer");
    expect(pushArg).toContain("duration=5");
  });
});
