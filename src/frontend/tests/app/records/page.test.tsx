import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import RecordsPage from "@/app/records/page";
import { renderWithAuth } from "../../helpers/render-utils";
import { resetRecords } from "../../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/records" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("RecordsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/records";
  });

  it("渲染标题'记录列表'", async () => {
    renderWithAuth(<RecordsPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("记录列表")).toBeInTheDocument();
    });
  });

  it("渲染'新增记录'按钮链接", async () => {
    renderWithAuth(<RecordsPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("新增记录")).toBeInTheDocument();
    });
  });
});
