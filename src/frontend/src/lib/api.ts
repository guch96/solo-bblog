import type {
  RecordData, RecordCreate, RecordUpdate,
  AnalysisData, AnalysisRequest,
  CalendarDay, StatsData,
  ProcessFeelingType,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // 自动注入 JWT Token（浏览器端）
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pooptracker_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "网络错误" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// 记录 API
export const recordsApi = {
  list: (params?: { date_from?: string; date_to?: string }) => {
    const search = new URLSearchParams();
    if (params?.date_from) search.set("date_from", params.date_from);
    if (params?.date_to) search.set("date_to", params.date_to);
    const qs = search.toString();
    return request<RecordData[]>(`/api/records${qs ? `?${qs}` : ""}`);
  },

  get: (id: number) => request<RecordData>(`/api/records/${id}`),

  create: (data: RecordCreate) =>
    request<RecordData>("/api/records", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: RecordUpdate) =>
    request<RecordData>(`/api/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/records/${id}`, { method: "DELETE" }),

  calendar: (month: string) =>
    request<CalendarDay[]>(`/api/records/calendar?month=${month}`),

  stats: (days: number) =>
    request<StatsData>(`/api/records/stats?days=${days}`),
};

// 分析 API
export const analysesApi = {
  create: (data: AnalysisRequest) =>
    request<AnalysisData>("/api/analyses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: () => request<AnalysisData[]>("/api/analyses"),

  get: (id: number) => request<AnalysisData>(`/api/analyses/${id}`),

  stream: async (
    data: AnalysisRequest,
    onChunk: (text: string) => void,
    onSuggestions: (suggestions: string[]) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ) => {
    // 自动注入 JWT Token（浏览器端），与 request() 函数一致
    const token = typeof window !== "undefined" ? localStorage.getItem("pooptracker_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api/analyses/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "流式请求失败" }));
      onError(err.detail || `HTTP ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("浏览器不支持流式读取");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "summary_chunk") {
              onChunk(payload.content);
            } else if (payload.type === "suggestions") {
              onSuggestions(payload.content);
            } else if (payload.type === "done") {
              onDone();
            } else if (payload.type === "error") {
              onError(payload.content);
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    }
  },
};
