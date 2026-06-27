import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import { render } from "@testing-library/react";
import StreamingAnalysisCard from "@/components/analysis/StreamingAnalysisCard";

// vi.hoisted 确保变量在 vi.mock 工厂 hoisting 之前初始化
const { mockStream } = vi.hoisted(() => ({
  mockStream: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  analysesApi: { stream: mockStream },
}));

describe("StreamingAnalysisCard", () => {
  // 用于捕获 stream() 的回调，方便在测试中模拟流式推送
  const streamCbs: Record<string, Function> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    streamCbs.onChunk = () => {};
    streamCbs.onSuggestions = () => {};
    streamCbs.onDone = () => {};
    streamCbs.onError = () => {};
    mockStream.mockImplementation(
      (
        _data: unknown,
        onChunk: Function,
        onSuggestions: Function,
        onDone: Function,
        onError: Function,
      ) => {
        streamCbs.onChunk = onChunk;
        streamCbs.onSuggestions = onSuggestions;
        streamCbs.onDone = onDone;
        streamCbs.onError = onError;
      },
    );
  });

  it("渲染日期范围", () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText(/2026-06-20/)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-27/)).toBeInTheDocument();
  });

  it("初始显示 AI 分析中...", () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText("AI 分析中...")).toBeInTheDocument();
  });

  it("组件卸载时不抛出错误", () => {
    const { unmount } = render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );
    expect(() => unmount()).not.toThrow();
  });

  it("接收流式文本后更新摘要内容", async () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );

    act(() => {
      streamCbs.onChunk("您的肠道健康状况良好");
    });

    await waitFor(() => {
      expect(screen.getByText(/您的肠道健康状况良好/)).toBeInTheDocument();
    });
  });

  it("多次流式文本累加显示", async () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );

    act(() => {
      streamCbs.onChunk("第一部分。");
    });
    act(() => {
      streamCbs.onChunk("第二部分。");
    });

    await waitFor(() => {
      expect(screen.getByText(/第一部分。第二部分。/)).toBeInTheDocument();
    });
  });

  it("接收建议后显示健康建议列表", async () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );

    // 此时建议列表不应出现
    expect(screen.queryByText("增加纤维摄入")).not.toBeInTheDocument();

    act(() => {
      streamCbs.onSuggestions(["增加纤维摄入", "保持规律排便"]);
    });

    await waitFor(() => {
      expect(screen.getByText("增加纤维摄入")).toBeInTheDocument();
      expect(screen.getByText("保持规律排便")).toBeInTheDocument();
    });
  });

  it("完成时标题变为分析完成并触发 onComplete 回调", async () => {
    const onComplete = vi.fn();
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={onComplete}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByText("AI 分析中...")).toBeInTheDocument();

    act(() => {
      streamCbs.onDone();
    });

    await waitFor(() => {
      expect(screen.getByText("分析完成")).toBeInTheDocument();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("错误时显示错误信息并触发 onError 回调", async () => {
    const onError = vi.fn();
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={onError}
      />,
    );

    act(() => {
      streamCbs.onError("AI 服务暂时不可用");
    });

    await waitFor(() => {
      expect(screen.getByText("AI 服务暂时不可用")).toBeInTheDocument();
    });
    expect(onError).toHaveBeenCalledWith("AI 服务暂时不可用");
  });

  it("错误状态下不显示摘要和建议区域", async () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-20"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );

    act(() => {
      streamCbs.onError("分析出错");
    });

    await waitFor(() => {
      expect(screen.getByText("分析出错")).toBeInTheDocument();
    });
    // 错误状态下不应该显示健康建议标题
    expect(screen.queryByText("健康建议")).not.toBeInTheDocument();
  });

  it("传递正确的日期参数给 stream API", () => {
    render(
      <StreamingAnalysisCard
        dateFrom="2026-06-01"
        dateTo="2026-06-27"
        onComplete={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(mockStream).toHaveBeenCalledWith(
      { date_from: "2026-06-01", date_to: "2026-06-27" },
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(AbortSignal),
    );
  });
});
