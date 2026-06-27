import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";
import { resetRecords } from "../mocks/handlers";

// Mock router
const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/calendar",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetRecords();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

describe("CalendarHeatmap", () => {
  it("渲染当前月份标题（2026年6月）", async () => {
    render(<CalendarHeatmap />);
    await waitFor(() => {
      expect(screen.getByText("2026年6月")).toBeInTheDocument();
    });
  });

  it("渲染周标题", async () => {
    render(<CalendarHeatmap />);
    await waitFor(() => {
      expect(screen.getByText("日")).toBeInTheDocument();
      expect(screen.getByText("一")).toBeInTheDocument();
    });
  });

  it("渲染图例", async () => {
    render(<CalendarHeatmap />);
    await waitFor(() => {
      expect(screen.getByText("少")).toBeInTheDocument();
      expect(screen.getByText("多")).toBeInTheDocument();
    });
  });
});
