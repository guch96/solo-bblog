import { http, HttpResponse } from "msw";
import type {
  RecordData, CalendarDay, StatsData, AnalysisData,
} from "@/lib/types";

const BASE_URL = "http://localhost:8000";

let records: RecordData[] = [];

function makeRecord(overrides: Partial<RecordData> = {}): RecordData {
  return {
    id: Date.now(),
    start_time: "2026-06-27T10:00:00",
    end_time: "2026-06-27T10:05:00",
    duration: 300,
    shape: "4",
    color: "brown",
    smell: "normal",
    comfort: "comfortable",
    process_feeling: "smooth",
    notes: "测试备注",
    input_mode: "manual",
    created_at: "2026-06-27T10:00:00",
    updated_at: "2026-06-27T10:00:00",
    ...overrides,
  };
}

export function seedRecords(items: RecordData[]) {
  records = [...items];
}

export function resetRecords() {
  records = [];
}

export function getHandlers() {
  return [
    // ===== Auth =====
    http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
      const body = await request.json() as { username: string; password: string };
      if (body.username === "user1" && body.password === "123456") {
        return HttpResponse.json({
          access_token: "mock-jwt-token-123",
          token_type: "bearer",
          user_id: 1,
          username: "user1",
        });
      }
      return HttpResponse.json({ detail: "用户名或密码错误" }, { status: 401 });
    }),

    http.get(`${BASE_URL}/api/auth/me`, ({ request }) => {
      const auth = request.headers.get("Authorization");
      if (auth === "Bearer mock-jwt-token-123") {
        return HttpResponse.json({ id: 1, username: "user1" });
      }
      return HttpResponse.json({ detail: "未认证" }, { status: 401 });
    }),

    // ===== Records CRUD =====
    http.get(`${BASE_URL}/api/records`, ({ request }) => {
      const url = new URL(request.url);
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");

      let filtered = [...records];
      if (dateFrom) {
        filtered = filtered.filter((r) => r.start_time.slice(0, 10) >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter((r) => r.start_time.slice(0, 10) <= dateTo);
      }
      return HttpResponse.json(filtered);
    }),

    // Calendar & Stats 必须放在 :id 之前，否则 :id 会先匹配到 "calendar"/"stats" 路径段
    http.get(`${BASE_URL}/api/records/calendar`, ({ request }) => {
      const url = new URL(request.url);
      const month = url.searchParams.get("month") || "2026-06";
      const days: CalendarDay[] = [];
      const year = Number(month.slice(0, 4));
      const mon = Number(month.slice(5, 7));
      const daysInMonth = new Date(year, mon, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const count = records.filter((r) => r.start_time.slice(0, 10) === dateStr).length;
        days.push({ date: dateStr, count });
      }
      return HttpResponse.json(days);
    }),

    http.get(`${BASE_URL}/api/records/stats`, () => {
      const data: StatsData = {
        frequency: [{ date: "2026-06-27", count: 2 }],
        avg_duration: [{ date: "2026-06-27", avg_seconds: 250 }],
        shape_distribution: [{ shape: "4", count: 3 }],
        summary: {
          total_count: 10,
          this_week_count: 5,
          avg_duration_seconds: 280,
          most_common_shape: "4",
          most_common_shape_label: "光滑条状",
          abnormal_days: 1,
          avg_frequency_per_day: 1.5,
          longest_duration_seconds: 500,
          record_days: 7,
          streak_days: 4,
        },
      };
      return HttpResponse.json(data);
    }),

    http.get(`${BASE_URL}/api/records/:id`, ({ params }) => {
      const record = records.find((r) => r.id === Number(params.id));
      if (!record) return HttpResponse.json({ detail: "记录不存在" }, { status: 404 });
      return HttpResponse.json(record);
    }),

    http.post(`${BASE_URL}/api/records`, async ({ request }) => {
      const body = await request.json() as Partial<RecordData>;
      const newRecord = makeRecord({ id: Date.now() + Math.random(), ...body });
      records.unshift(newRecord);
      return HttpResponse.json(newRecord, { status: 201 });
    }),

    http.put(`${BASE_URL}/api/records/:id`, async ({ params, request }) => {
      const body = await request.json() as Partial<RecordData>;
      const idx = records.findIndex((r) => r.id === Number(params.id));
      if (idx === -1) return HttpResponse.json({ detail: "记录不存在" }, { status: 404 });
      records[idx] = { ...records[idx], ...body, updated_at: new Date().toISOString() };
      return HttpResponse.json(records[idx]);
    }),

    http.delete(`${BASE_URL}/api/records/:id`, ({ params }) => {
      const idx = records.findIndex((r) => r.id === Number(params.id));
      if (idx === -1) return HttpResponse.json({ detail: "记录不存在" }, { status: 404 });
      records.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),

    // ===== Analyses =====
    http.post(`${BASE_URL}/api/analyses`, async () => {
      const analysis: AnalysisData = {
        id: 99,
        date_from: "2026-06-20",
        date_to: "2026-06-27",
        provider: "TestProvider",
        model: "test-model",
        summary: "您的肠道健康状况良好，布里斯托评分以4型为主。",
        suggestions: JSON.stringify(["增加膳食纤维摄入", "保持规律排便习惯", "每天饮水量建议达到2L"]),
        record_ids: JSON.stringify([1, 2, 3]),
        created_at: "2026-06-27T12:00:00",
      };
      return HttpResponse.json(analysis);
    }),

    http.get(`${BASE_URL}/api/analyses`, () => {
      const list: AnalysisData[] = [
        {
          id: 1,
          date_from: "2026-06-20",
          date_to: "2026-06-27",
          provider: "TestProvider",
          model: "test-model",
          summary: "您的肠道健康状况良好，布里斯托评分以4型为主。建议增加纤维摄入。",
          suggestions: JSON.stringify(["增加膳食纤维摄入", "保持规律排便习惯"]),
          record_ids: JSON.stringify([1, 2, 3]),
          created_at: "2026-06-27T12:00:00",
        },
      ];
      return HttpResponse.json(list);
    }),

    http.get(`${BASE_URL}/api/analyses/:id`, ({ params }) => {
      const analysis: AnalysisData = {
        id: Number(params.id),
        date_from: "2026-06-20",
        date_to: "2026-06-27",
        provider: "TestProvider",
        model: "test-model",
        summary: "分析详情...",
        suggestions: JSON.stringify(["建议1", "建议2"]),
        record_ids: null,
        created_at: "2026-06-27T12:00:00",
      };
      return HttpResponse.json(analysis);
    }),
  ];
}
