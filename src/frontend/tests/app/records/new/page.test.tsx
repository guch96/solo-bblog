import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import NewRecordPage from "@/app/records/new/page";
import { renderWithAuth } from "../../../helpers/render-utils";
import { resetRecords } from "../../../mocks/handlers";

const navState = vi.hoisted(() => ({
  pathname: { current: "/records/new" },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn(),
  }),
  usePathname: () => navState.pathname.current,
  useSearchParams: () => navState.searchParams.current,
}));

describe("NewRecordPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRecords();
    localStorage.clear();
    navState.pathname.current = "/records/new";
  });

  it("渲染页面标题'新增记录'", async () => {
    renderWithAuth(<NewRecordPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("新增记录")).toBeInTheDocument();
    });
  });

  it("渲染保存和取消按钮", async () => {
    renderWithAuth(<NewRecordPage />, { token: "mock-jwt-token-123" });

    await waitFor(() => {
      expect(screen.getByText("保存记录")).toBeInTheDocument();
      expect(screen.getByText("取消")).toBeInTheDocument();
    });
  });
});
