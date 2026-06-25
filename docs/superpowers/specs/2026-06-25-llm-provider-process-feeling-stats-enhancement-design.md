# 设计文档：LLM Provider 配置化 + 排便过程感受 + 统计增强

> 日期：2026-06-25 | 状态：已确认 | 方案：增量渐进（A）

---

## 1. LLM Provider 配置化 + SSE 流式输出

### 1.1 后端 .env 配置

```env
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
```

所有参数通过 `os.getenv()` 读取，无需修改 `get_provider()` 签名。旧 `.env` 键废弃，不做向后兼容。

### 1.2 llm_provider.py 改造

- `OpenAIProvider` 重命名为 `OpenAICompatibleProvider`
- 构造方法从 `.env` 读取 `LLM_MODEL`、`LLM_API_KEY`、`LLM_BASE_URL`、`LLM_TEMPERATURE`、`LLM_MAX_TOKENS`
- 保留现有 `def analyze()` 同步方法（非流式，保留作为 fallback）
- 新增 `def analyze_stream()` 生成器方法，调用 OpenAI SDK `stream=True`，逐 token yield
- 删除 `MockOpenAIProvider`
- `get_provider()` 简化，移除 `LLM_PROVIDER` 环境变量判断

### 1.3 新增流式端点

**`POST /api/analyses/stream`**

- 请求体：`AnalysisRequest`（date_from, date_to）
- 响应头：`Content-Type: text/event-stream`
- SSE 事件类型：
  - `summary_chunk` — 分析摘要的增量文本片段
  - `suggestions` — 健康建议列表（末尾一次性推送）
  - `done` — 流式结束标记

System prompt 改造：要求 LLM 先输出摘要，再用 `---SUGGESTIONS---` 分隔符后输出 JSON 建议数组。后端解析时分离两者，摘要逐 chunk 推送，建议解析后一次性推送。

### 1.4 前端

- `lib/api.ts` 新增 `analysesApi.stream()` 方法，返回 `ReadableStream`
- `analysis/page.tsx`：分析中展示流式输出区域，替代 loading spinner
- 新增 `StreamingAnalysisCard` 组件：接收 stream，逐行解析 SSE 并累积渲染，完成时切换为 `AnalysisCard` 样式

---

## 2. 排便过程感受字段全栈新增

### 2.1 后端

**数据模型** `models.py`：
```python
process_feeling = Column(String(20), nullable=True)
```

**Schema** `schemas.py`：
```python
class ProcessFeelingEnum(str, Enum):
    SMOOTH = "smooth"         # 顺畅
    URGENT = "urgent"           # 急迫
    STRAINING = "straining"     # 费力
    INCOMPLETE = "incomplete"   # 便不尽感
    INTERMITTENT = "intermittent" # 断断续续
    NORMAL = "normal"           # 正常
    OTHER = "other"            # 其他
```

`RecordCreate`、`RecordUpdate`、`RecordResponse` 均添加 `process_feeling` 可选字段。

**业务逻辑 `record_service.py`**：`create_record` 和 `update_record` 中处理新字段。

**AI 分析 `analysis_service.py`**：`records_data` 中包含 `process_feeling` 字段传给 LLM，System prompt 同步增加过程感受分析维度。

### 2.2 前端

**类型定义** `lib/types.ts` 新增：
```ts
export type ProcessFeelingType = "smooth" | "urgent" | "straining" | "incomplete" | "intermittent" | "normal" | "other";

export const PROCESS_FEELING_LABELS: Record<ProcessFeelingType, string> = {
  smooth: "顺畅", urgent: "急迫", straining: "费力",
  incomplete: "便不尽感", intermittent: "断断续续", normal: "正常", other: "其他",
};
```

`RecordData`、`RecordCreate`、`RecordUpdate` 接口均添加 `process_feeling` 字段。

**表单组件** `RecordForm.tsx`：
- 新增「排便过程感受」卡片选择器区块，与现有形状/气味/感受风格一致
- 表情配置：顺畅💨 急迫🏃 费力💪 便不尽感🔄 断断续续⏸ 正常👌 其他🤷
- 表单状态添加 `process_feeling: string`

---

## 3. 统计页面增强

### 3.1 后端

`get_stats()` 返回数据扩展，新增 `summary` 字段包含：
- `total_count`：总记录数
- `this_week_count`：本周次数
- `avg_duration_seconds`：全局平均时长
- `most_common_shape`：最常见形状编号
- `most_common_shape_label`：最常见形状中文标签
- `abnormal_days`：异常天数
- `avg_frequency_per_day`：日均频率
- `longest_duration_seconds`：最长单次时长
- `record_days`：有记录天数
- `streak_days`：最长连续打卡天数

`StatsResponse` schema 新增 `summary: dict | None` 字段。

### 3.2 前端

**新增 `StatsSummaryCards` 组件**：

4 列响应式网格（lg:4 md:2），10 张数据卡片：
1. 📋 总记录
2. 📅 本周
3. 📊 日均
4. 🔥 连续打卡
5. ⏱ 平均时长
6. 🐢 最长时长
7. 💩 常见形状
8. ⚠️ 异常天数
9. 📆 记录天数
10. 🤖 AI 分析

每张卡片结构：图标 + 大号数值 + 小号标签。

**`StatsCharts.tsx` 柱状图增强**：

- 使用 `<linearGradient>` 为柱子添加渐变填充
- `<Tooltip>` 自定义组件，毛玻璃效果（`backdrop-blur`）
- hover 时柱子高亮 + 微缩放动画
- 入场动画（CSS keyframes + Recharts animationBegin/animationDuration）

**`StatsPage` 结构**：
```tsx
// 卡片区域
<StatsSummaryCards data={data.summary} />
// 图表区域（现有三图，柱状图增强）
<StatsCharts data={data} />
```

---

## 4. 改动文件清单

| 文件 | 改动类型 |
|------|---------|
| `src/backend/.env.example` | 修改 — 更新配置项 |
| `src/backend/models.py` | 修改 — 新增 process_feeling 列 |
| `src/backend/schemas.py` | 修改 — 新增枚举 + 字段 |
| `src/backend/services/llm_provider.py` | 重构 — 配置化 + 流式方法 |
| `src/backend/services/analysis_service.py` | 修改 — 数据字段 + system prompt |
| `src/backend/services/record_service.py` | 修改 — 新字段处理 + stats 扩展 |
| `src/backend/routers/analyses.py` | 修改 — 新增 stream 端点 |
| `src/frontend/src/lib/types.ts` | 修改 — 新增类型和映射 |
| `src/frontend/src/lib/api.ts` | 修改 — 新增 stream 方法 |
| `src/frontend/src/components/records/RecordForm.tsx` | 修改 — 新增过程感受区块 |
| `src/frontend/src/components/charts/StatsCharts.tsx` | 修改 — 柱状图增强 + 接入 summary |
| `src/frontend/src/components/charts/StatsSummaryCards.tsx` | 新增 — 统计卡片组件 |
| `src/frontend/src/components/analysis/StreamingAnalysisCard.tsx` | 新增 — 流式输出卡片 |
| `src/frontend/src/app/analysis/page.tsx` | 修改 — 流式输出集成 |
| `src/frontend/src/app/stats/page.tsx` | 修改 — 接入卡片组件 |

---

## 5. 测试要点

- [ ] LLM 配置：切换不同 base_url/model 能正常调用（DeepSeek、Qwen 等）
- [ ] 流式输出：SSE 连接正常，碎片组装完整，完成后数据已持久化
- [ ] 过程感受：创建/编辑记录时新字段正确保存和回显
- [ ] AI 分析：分析结果包含过程感受维度的评估
- [ ] 统计卡片：数值计算正确，连续打卡逻辑正确
- [ ] 柱状图：渐变渲染正常，动画流畅
