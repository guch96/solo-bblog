import type {
  RecordData, RecordCreate, RecordUpdate,
  AnalysisData, AnalysisRequest,
  CalendarDay, StatsData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
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
};
