# LLM Provider + Process Feeling + Stats Enhancement 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 OpenAI 兼容 LLM 配置化 + SSE 流式分析、排便过程感受全栈字段、统计页面卡片+图表增强

**Architecture:** 增量渐进式，在现有代码结构上扩展。后端扩展现有 Provider 抽象层 + 新增 SSE 端点；前端在现有组件内增加卡片区域并增强图表视觉效果。

**Tech Stack:** Python FastAPI + SQLAlchemy + OpenAI SDK (stream) / Next.js + TypeScript + Recharts + Tailwind CSS

## Global Constraints

- 所有 LLM 参数（MODEL/API_KEY/BASE_URL/TEMPERATURE/MAX_TOKENS）从 `.env` 读取
- 不做向后兼容，旧 env 键直接废弃
- 流式输出使用 SSE（Server-Sent Events），Response content-type: text/event-stream
- process_feeling 枚举值：smooth/urgent/straining/incomplete/intermittent/normal/other
- 统计卡片数量：10 张，4 列响应式布局
- 柱状图增强：渐变填充 + 圆角 + hover 高亮 + 入场动画

---

### Task 1: LLM Provider 重构——OpenAiCompatibleProvider

**Files:**
- Modify: `src/backend/.env.example`
- Modify: `src/backend/services/llm_provider.py`

**Interfaces:**
- Produces: `OpenAICompatibleProvider(model, api_key, base_url, temperature, max_tokens)` — 构造时从 env 读取参数
- Produces: `OpenAICompatibleProvider.analyze(records, date_from, date_to) -> dict` — 同步分析（保留）
- Produces: `get_provider() -> LLMProvider` — 工厂函数，简化为直接返回 `OpenAICompatibleProvider()`

- [ ] **Step 1: 更新 .env.example**

```env
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
```

- [ ] **Step 2: 重写 llm_provider.py**

```python
"""LLM Provider 抽象层 — 支持 OpenAI 兼容协议的任意 LLM 厂商"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Generator
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """LLM Provider 抽象基类"""

    def __init__(self, model: str):
        self.model = model

    @abstractmethod
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """
        分析记录数据并返回健康建议。
        返回: {"summary": str, "suggestions": list[str], "model": str, "provider": str}
        """
        ...

    @abstractmethod
    def analyze_stream(self, records: list[dict], date_from: str, date_to: str) -> Generator[str, None, None]:
        """
        流式分析，逐 token yield SSE 格式数据。
        yield 格式:
          - "data: {\"type\":\"summary_chunk\",\"content\":\"...\"}\n\n"
          - "data: {\"type\":\"suggestions\",\"content\":[...]}\n\n"
          - "data: {\"type\":\"done\"}\n\n"
        """
        ...


class OpenAICompatibleProvider(LLMProvider):
    """OpenAI 兼容协议 Provider — 支持 OpenAI / DeepSeek / Qwen / GLM 等"""

    def __init__(self):
        super().__init__(os.getenv("LLM_MODEL", "gpt-4o-mini"))
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "2048"))

    def _build_client(self):
        from openai import OpenAI
        return OpenAI(api_key=self.api_key, base_url=self.base_url)

    def _system_prompt(self) -> str:
        return """你是一位专业的肠道健康专家。请根据用户的如厕记录数据，从以下维度分析肠道健康状况：
1. 排便频率是否正常
2. 布里斯托大便分类法形状分布是否健康
3. 排便过程感受是否存在异常（顺畅度、急迫感、费力程度等）
4. 身体感受是否有需要关注的信号
5. 是否有异常情况需要关注（颜色异常、持续腹泻/便秘等）
6. 提供具体的饮食和生活习惯建议

请用以下格式回复：
先输出一段中文分析摘要（纯文本），然后在摘要末尾换行后输出分隔符 ---SUGGESTIONS---，再输出包含 suggestions 字段的 JSON 数组。
JSON 格式：{"suggestions": ["建议1", "建议2", ...]}"""

    def _build_records_json(self, records: list[dict]) -> str:
        return json.dumps(records, ensure_ascii=False, default=str)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """同步分析（非流式）"""
        logger.info("分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = self._build_client()
        records_json = self._build_records_json(records)

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\n\n记录数据：\n{records_json}"},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        content = response.choices[0].message.content
        result = self._parse_response(content)
        logger.info("分析完成: tokens=%d", response.usage.total_tokens)

        return {
            "summary": result["summary"],
            "suggestions": result["suggestions"],
            "model": self.model,
            "provider": "openai",
        }

    def analyze_stream(self, records: list[dict], date_from: str, date_to: str) -> Generator[str, None, None]:
        """流式分析，逐 token 推送 SSE 事件"""
        logger.info("流式分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = self._build_client()
        records_json = self._build_records_json(records)

        stream = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\n\n记录数据：\n{records_json}"},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )

        buffer = ""
        summary_done = False

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                buffer += delta.content

                # 检查是否遇到了分隔符
                if "---SUGGESTIONS---" in buffer:
                    # 分离摘要和建议
                    idx = buffer.index("---SUGGESTIONS---")
                    summary_part = buffer[:idx]
                    # 推送分隔符前尚未推送的摘要部分
                    remaining_summary = summary_part
                    if not summary_done:
                        yield f"data: {json.dumps({'type': 'summary_chunk', 'content': remaining_summary})}\n\n"
                        summary_done = True
                    # 切换 buffer 为分隔符后的内容
                    buffer = buffer[idx + len("---SUGGESTIONS---"):]
                else:
                    if not summary_done:
                        yield f"data: {json.dumps({'type': 'summary_chunk', 'content': delta.content})}\n\n"

        # 流结束后解析剩余 buffer 中的 suggestions JSON
        try:
            suggestions_data = json.loads(buffer.strip())
            suggestions = suggestions_data.get("suggestions", [])
        except (json.JSONDecodeError, AttributeError):
            suggestions = []

        yield f"data: {json.dumps({'type': 'suggestions', 'content': suggestions}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        logger.info("流式分析完成")

    def _parse_response(self, content: str) -> dict:
        """解析 LLM 响应，分离摘要和建议"""
        if "---SUGGESTIONS---" in content:
            idx = content.index("---SUGGESTIONS---")
            summary = content[:idx].strip()
            json_part = content[idx + len("---SUGGESTIONS---"):].strip()
        else:
            summary = content
            json_part = "{}"

        try:
            suggestions_data = json.loads(json_part)
            suggestions = suggestions_data.get("suggestions", [])
        except json.JSONDecodeError:
            suggestions = []

        return {"summary": summary, "suggestions": suggestions}


def get_provider() -> LLMProvider:
    """工厂函数：返回 OpenAI 兼容 Provider 实例"""
    logger.info("初始化 LLM Provider: model=%s base_url=%s",
                os.getenv("LLM_MODEL", "gpt-4o-mini"),
                os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"))
    return OpenAICompatibleProvider()
```

- [ ] **Step 3: 验证——启动后端确认无导入错误**

```bash
cd src/backend && python -c "from services.llm_provider import get_provider; p = get_provider(); print(f'OK: {p.model}')"
```
Expected: `OK: gpt-4o-mini`

- [ ] **Step 4: 更新测试——test_llm_provider.py**

将导入从 `OpenAIProvider` 改为 `OpenAICompatibleProvider`，移除无效的 `LLM_PROVIDER` 相关测试：

```python
"""LLM Provider 测试"""
from services.llm_provider import LLMProvider, OpenAICompatibleProvider, get_provider


class MockOpenAIProvider(LLMProvider):
    """模拟 Provider 用于测试"""
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        return {
            "summary": f"分析了 {len(records)} 条记录",
            "suggestions": ["多喝水", "多吃纤维"],
            "model": "mock-model",
            "provider": "mock_provider",
        }

    def analyze_stream(self, records: list[dict], date_from: str, date_to: str):
        """流式分析的 mock 实现"""
        yield 'data: {"type":"summary_chunk","content":"mock 摘要"}\n\n'
        yield 'data: {"type":"suggestions","content":["建议1","建议2"]}\n\n'
        yield 'data: {"type":"done"}\n\n'


def test_provider_interface():
    """测试 Provider 抽象接口"""
    provider = MockOpenAIProvider("mock-model")
    result = provider.analyze(
        [{"shape": "4", "color": "brown"}],
        "2026-06-01",
        "2026-06-07",
    )
    assert "summary" in result
    assert "suggestions" in result
    assert "model" in result
    assert len(result["suggestions"]) == 2


def test_provider_analyze_output_format():
    """测试分析结果格式正确"""
    provider = MockOpenAIProvider("mock-model")
    records = [
        {"start_time": "2026-06-24T08:00:00", "shape": "4", "color": "brown", "comfort": "comfortable"},
    ]
    result = provider.analyze(records, "2026-06-24", "2026-06-24")
    assert isinstance(result["summary"], str)
    assert len(result["summary"]) > 0
    assert isinstance(result["suggestions"], list)
    for s in result["suggestions"]:
        assert isinstance(s, str)
        assert len(s) > 0


def test_provider_analyze_stream():
    """测试流式分析接口协议"""
    provider = MockOpenAIProvider("mock-model")
    events = list(provider.analyze_stream(
        [{"shape": "4"}], "2026-06-24", "2026-06-24"
    ))
    assert len(events) == 3
    assert events[0].startswith("data: ")
    assert events[-1] == 'data: {"type":"done"}\n\n'


def test_get_provider_returns_configured_instance(monkeypatch):
    """测试 get_provider 返回 OpenAICompatibleProvider 并使用配置"""
    monkeypatch.setenv("LLM_MODEL", "gpt-4o")
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    monkeypatch.setenv("LLM_BASE_URL", "https://custom.api.com/v1")
    monkeypatch.setenv("LLM_TEMPERATURE", "0.3")
    monkeypatch.setenv("LLM_MAX_TOKENS", "4096")
    provider = get_provider()
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.model == "gpt-4o"
    assert provider.api_key == "test-key"
    assert provider.base_url == "https://custom.api.com/v1"
    assert provider.temperature == 0.3
    assert provider.max_tokens == 4096
```

- [ ] **Step 5: 更新测试——test_analyses.py**

`MockOpenAIProvider` 已从 `llm_provider.py` 移除，分析测试改用 patch `get_provider` 返回 mock 实例：

```python
"""AI 分析 API 测试"""
from unittest.mock import patch, MagicMock


def test_create_analysis(client):
    """测试触发 AI 分析"""
    for i in range(3):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "shape": "4",
            "input_mode": "timer",
        })

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.analyze.return_value = {
        "summary": "测试摘要：分析了 3 条记录，您的肠道健康状况良好。",
        "suggestions": ["多喝水", "多吃纤维"],
        "model": "mock-model",
        "provider": "mock_provider",
    }

    with patch("services.analysis_service.get_provider", return_value=mock_provider):
        resp = client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    assert resp.status_code == 201
    data = resp.json()
    assert "测试摘要" in data["summary"]


def test_get_analyses(client):
    """测试获取分析历史"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.analyze.return_value = {
        "summary": "测试摘要",
        "suggestions": ["建议1"],
        "model": "mock-model",
        "provider": "mock_provider",
    }

    with patch("services.analysis_service.get_provider", return_value=mock_provider):
        client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    resp = client.get("/api/analyses")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_analysis_detail(client):
    """测试获取单条分析详情"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.analyze.return_value = {
        "summary": "分析详情测试",
        "suggestions": [],
        "model": "mock-model",
        "provider": "mock_provider",
    }

    with patch("services.analysis_service.get_provider", return_value=mock_provider):
        client.post("/api/analyses", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    resp = client.get("/api/analyses/1")
    assert resp.status_code == 200
    assert "summary" in resp.json()


def test_analysis_no_records(client):
    """测试无记录时分析返回 400"""
    resp = client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })
    assert resp.status_code == 400
```

- [ ] **Step 6: 运行测试验证无回归**

```bash
cd src/backend && python -m pytest tests/test_llm_provider.py tests/test_analyses.py -v
```
Expected: 所有测试 PASS（预计 ~8 tests passed）

- [ ] **Step 7: Commit**

```bash
git add src/backend/.env.example src/backend/services/llm_provider.py src/backend/tests/test_llm_provider.py src/backend/tests/test_analyses.py
git commit -m "refactor: LLM Provider 重构为 OpenAI 兼容协议，支持 .env 参数化配置"
```

---

### Task 2: 排便过程感受——后端全栈（Model + Schema + Service + Analysis）

**Files:**
- Modify: `src/backend/models.py`
- Modify: `src/backend/schemas.py`
- Modify: `src/backend/services/record_service.py`
- Modify: `src/backend/services/analysis_service.py`

**Interfaces:**
- Consumes: `Record` model (adds column), `RecordCreate/Update/Response` schemas (adds field)
- Produces: `ProcessFeelingEnum` in schemas.py
- Produces: `process_feeling` field on Record ORM model
- Produces: `process_feeling` in `records_data` dict passed to LLM

- [ ] **Step 1: 修改 models.py——添加 process_feeling 列**

在 `Record` 类的 `comfort` 列定义后添加：
```python
    process_feeling = Column(String(20), nullable=True)  # 排便过程感受
```

- [ ] **Step 2: 修改 schemas.py——添加枚举和字段**

在 `ComfortEnum` 之后添加枚举：
```python
class ProcessFeelingEnum(str, Enum):
    SMOOTH = "smooth"
    URGENT = "urgent"
    STRAINING = "straining"
    INCOMPLETE = "incomplete"
    INTERMITTENT = "intermittent"
    NORMAL = "normal"
    OTHER = "other"
```

在 `RecordCreate` 类中添加字段（`input_mode` 之前）：
```python
    process_feeling: ProcessFeelingEnum | None = None
```

在 `RecordUpdate` 类中添加字段（`input_mode` 之前）：
```python
    process_feeling: ProcessFeelingEnum | None = None
```

在 `RecordResponse` 类中添加字段（`comfort` 之后）：
```python
    process_feeling: str | None
```

- [ ] **Step 3: 修改 record_service.py——处理新字段**

在 `create_record()` 的 `record = Record(...)` 构造中添加：
```python
        process_feeling=data.process_feeling.value if data.process_feeling else None,
```

在 `update_record()` 的枚举字段列表 `["shape", "color", "smell", "comfort", "input_mode"]` 中添加：
```python
    for field in ["shape", "color", "smell", "comfort", "process_feeling", "input_mode"]:
```

- [ ] **Step 4: 修改 analysis_service.py——传递新字段给 LLM**

在 `records_data` 列表字典中添加 `process_feeling`：
```python
            "process_feeling": r.process_feeling,
```

- [ ] **Step 5: 验证——启动后端确认无导入错误**

```bash
cd src/backend && python -c "from models import Record; from schemas import RecordCreate; print('OK')"
```
Expected: `OK`

- [ ] **Step 6: 扩展 test_records.py——新增 process_feeling 字段测试**

在文件末尾添加以下测试函数：

```python
def test_create_record_with_process_feeling(client):
    """测试创建包含排便过程感受的记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "end_time": "2026-06-24T08:10:00",
        "duration": 600,
        "shape": "4",
        "color": "brown",
        "smell": "normal",
        "comfort": "comfortable",
        "process_feeling": "smooth",
        "notes": "顺畅",
        "input_mode": "timer",
    }
    resp = client.post("/api/records", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["process_feeling"] == "smooth"


def test_create_record_without_process_feeling(client):
    """测试不填过程感受也能创建记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    resp = client.post("/api/records", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["process_feeling"] is None


def test_update_record_process_feeling(client):
    """测试更新排便过程感受"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    })
    update = {"process_feeling": "urgent"}
    resp = client.put("/api/records/1", json=update)
    assert resp.status_code == 200
    assert resp.json()["process_feeling"] == "urgent"


def test_record_has_all_process_feeling_values(client):
    """测试所有过程感受枚举值都能正确存储"""
    values = ["smooth", "urgent", "straining", "incomplete", "intermittent", "normal", "other"]
    for v in values:
        payload = {
            "start_time": "2026-06-24T08:00:00",
            "process_feeling": v,
            "input_mode": "manual",
        }
        resp = client.post("/api/records", json=payload)
        assert resp.status_code == 201
        assert resp.json()["process_feeling"] == v
```

- [ ] **Step 7: 运行测试验证**

```bash
cd src/backend && python -m pytest tests/test_records.py -v
```
Expected: 新增 4 个测试 PASS，原有测试无回归（预计 ~9 tests passed）

- [ ] **Step 8: Commit**

```bash
git add src/backend/models.py src/backend/schemas.py src/backend/services/record_service.py src/backend/services/analysis_service.py src/backend/tests/test_records.py
git commit -m "feat: 后端新增排便过程感受(process_feeling)字段——模型/Schema/服务层/AI分析"
```

---

### Task 3: SSE 流式分析端点

**Files:**
- Modify: `src/backend/routers/analyses.py`

**Interfaces:**
- Consumes: `get_provider()` from `services.llm_provider`, `run_analysis` pattern from `services.analysis_service`
- Produces: `POST /api/analyses/stream` — SSE endpoint, Content-Type: text/event-stream

- [ ] **Step 1: 在 analyses.py 中添加流式端点**

在现有路由文件末尾添加：
```python
import json
import logging
from fastapi.responses import StreamingResponse
from services.llm_provider import get_provider
from services.analysis_service import _query_records  # noqa — 使用相同的查询逻辑

logger = logging.getLogger(__name__)


@router.post("/stream")
def create_analysis_stream(body: AnalysisRequest, db: Session = Depends(get_db)):
    """触发 AI 流式分析（SSE）"""
    from datetime import datetime
    from models import Record
    from services.analysis_service import _query_records  # 此处复用查询逻辑

    date_from = body.date_from
    date_to = body.date_to

    # 查询记录
    records = (
        db.query(Record)
        .filter(
            Record.start_time >= datetime.fromisoformat(date_from),
            Record.start_time <= datetime.fromisoformat(date_to + "T23:59:59"),
        )
        .all()
    )

    if not records:
        raise HTTPException(status_code=400, detail="该时间范围内没有记录，无法分析")

    records_data = [
        {
            "id": r.id,
            "start_time": r.start_time.isoformat() if r.start_time else None,
            "end_time": r.end_time.isoformat() if r.end_time else None,
            "duration": r.duration,
            "shape": r.shape,
            "color": r.color,
            "smell": r.smell,
            "comfort": r.comfort,
            "process_feeling": r.process_feeling,
            "notes": r.notes,
            "input_mode": r.input_mode,
        }
        for r in records
    ]

    provider = get_provider()

    def generate():
        """SSE 生成器"""
        summary_parts = []
        suggestions = []

        try:
            for sse_event in provider.analyze_stream(records_data, date_from, date_to):
                # 解析 SSE 事件收集 summary 和 suggestions 用于持久化
                if sse_event.startswith("data: "):
                    payload_str = sse_event[len("data: "):].strip()
                    try:
                        payload = json.loads(payload_str)
                        if payload["type"] == "summary_chunk":
                            summary_parts.append(payload["content"])
                        elif payload["type"] == "suggestions":
                            suggestions = payload["content"]
                    except json.JSONDecodeError:
                        pass
                yield sse_event

            # 流结束后保存分析结果
            summary = "".join(summary_parts)
            analysis = Analysis(
                date_from=datetime.fromisoformat(date_from),
                date_to=datetime.fromisoformat(date_to),
                provider="openai",
                model=provider.model,
                summary=summary,
                suggestions=json.dumps(suggestions, ensure_ascii=False),
                record_ids=json.dumps([r["id"] for r in records_data]),
            )
            db.add(analysis)
            db.commit()
            logger.info("流式分析持久化完成: id=%d", analysis.id)
        except Exception as e:
            logger.error("流式分析异常: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

注意：route 文件顶部需要添加 `import json` 和 `from fastapi.responses import StreamingResponse`，以及 `from services.llm_provider import get_provider`。

- [ ] **Step 2: 简化 analysis_service.py——提取查询辅助函数**

在 `analysis_service.py` 中添加可复用的查询逻辑。将 `run_analysis` 中的查询部分提取为独立函数供流式端点复用。实际上流式端点直接内联了查询逻辑，`analysis_service.py` 无需修改。

- [ ] **Step 3: 验证——启动后端并确认端点注册**

```bash
cd src/backend && python main.py &
sleep 3
curl -s http://localhost:8000/api/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 4: 在 test_analyses.py 中添加流式端点测试**

```python
def test_analysis_stream_sse_format(client):
    """测试流式分析返回 SSE 格式数据"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    })

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.analyze_stream.return_value = iter([
        'data: {"type":"summary_chunk","content":"mock 摘要内容"}\n\n',
        'data: {"type":"suggestions","content":["建议1","建议2"]}\n\n',
        'data: {"type":"done"}\n\n',
    ])

    with patch("routers.analyses.get_provider", return_value=mock_provider):
        resp = client.post("/api/analyses/stream", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        })

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    body = resp.text
    assert 'data: {"type":"summary_chunk"' in body
    assert 'data: {"type":"done"}' in body


def test_analysis_stream_no_records(client):
    """测试流式分析无记录时返回 400"""
    resp = client.post("/api/analyses/stream", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    })
    assert resp.status_code == 400
```

- [ ] **Step 5: 运行测试验证**

```bash
cd src/backend && python -m pytest tests/test_analyses.py -v
```
Expected: 新增流式测试 PASS（预计 ~6 tests passed）

- [ ] **Step 6: Commit**

```bash
git add src/backend/routers/analyses.py src/backend/tests/test_analyses.py
git commit -m "feat: 新增 POST /api/analyses/stream SSE 流式分析端点"
```

---

### Task 4: 前端类型定义 + API 客户端更新

**Files:**
- Modify: `src/frontend/src/lib/types.ts`
- Modify: `src/frontend/src/lib/api.ts`

**Interfaces:**
- Produces: `ProcessFeelingType`, `PROCESS_FEELING_LABELS`
- Produces: Updated `RecordData`, `RecordCreate`, `RecordUpdate` with `process_feeling`
- Produces: Updated `StatsData` with `summary` field
- Produces: `analysesApi.stream()` method

- [ ] **Step 1: 修改 types.ts——新增类型和映射**

在 `ComfortType` 之后添加：
```ts
export type ProcessFeelingType = "smooth" | "urgent" | "straining" | "incomplete" | "intermittent" | "normal" | "other";
```

在 `COMFORT_LABELS` 之后添加：
```ts
export const PROCESS_FEELING_LABELS: Record<ProcessFeelingType, string> = {
  smooth: "顺畅",
  urgent: "急迫",
  straining: "费力",
  incomplete: "便不尽感",
  intermittent: "断断续续",
  normal: "正常",
  other: "其他",
};
```

在 `RecordData` 接口中添加（`comfort` 之后）：
```ts
  process_feeling: ProcessFeelingType | null;
```

在 `RecordCreate` 接口中添加：
```ts
  process_feeling?: ProcessFeelingType | null;
```

在 `RecordUpdate` 接口中添加：
```ts
  process_feeling?: ProcessFeelingType | null;
```

在 `StatsData` 接口中添加 `summary` 字段：
```ts
export interface StatsData {
  frequency: { date: string; count: number }[];
  avg_duration: { date: string; avg_seconds: number }[];
  shape_distribution: { shape: string; count: number }[];
  summary: StatsSummary | null;
}

export interface StatsSummary {
  total_count: number;
  this_week_count: number;
  avg_duration_seconds: number;
  most_common_shape: string | null;
  most_common_shape_label: string | null;
  abnormal_days: number;
  avg_frequency_per_day: number;
  longest_duration_seconds: number;
  record_days: number;
  streak_days: number;
}
```

- [ ] **Step 2: 修改 api.ts——新增 stream 方法**

在 `analysesApi` 对象中添加 `stream` 方法：
```ts
  stream: async (
    data: AnalysisRequest,
    onChunk: (text: string) => void,
    onSuggestions: (suggestions: string[]) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ) => {
    const response = await fetch(`${BASE_URL}/api/analyses/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
```

- [ ] **Step 3: 验证——TypeScript 编译检查**

```bash
cd src/frontend && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/lib/types.ts src/frontend/src/lib/api.ts
git commit -m "feat: 前端类型/API新增 process_feeling 字段 + 流式分析方法"
```

---

### Task 5: RecordForm 新增「排便过程感受」卡片选择器

**Files:**
- Modify: `src/frontend/src/components/records/RecordForm.tsx`

**Interfaces:**
- Consumes: `ProcessFeelingType`, `PROCESS_FEELING_LABELS` from `@/lib/types`

- [ ] **Step 1: 在 import 中添加新类型**

在文件顶部的 import 中添加 `ProcessFeelingType` 和 `PROCESS_FEELING_LABELS`：
```tsx
import {
  SHAPE_LABELS, COLOR_LABELS, SMELL_LABELS, COMFORT_LABELS, PROCESS_FEELING_LABELS,
  type RecordCreate, type RecordData, type InputMode,
  type ShapeType, type ColorType, type SmellType, type ComfortType, type ProcessFeelingType,
} from "@/lib/types";
```

- [ ] **Step 2: 添加 process_feeling 选项配置**

在 `COMFORT_OPTIONS` 之后添加：
```tsx
const PROCESS_FEELING_OPTIONS: { key: ProcessFeelingType; emoji: string; label: string; desc: string }[] = [
  { key: "smooth", emoji: "💨", label: "顺畅", desc: "一气呵成" },
  { key: "urgent", emoji: "🏃", label: "急迫", desc: "突然急需" },
  { key: "straining", emoji: "💪", label: "费力", desc: "需要用力" },
  { key: "incomplete", emoji: "🔄", label: "便不尽感", desc: "排不干净" },
  { key: "intermittent", emoji: "⏸", label: "断断续续", desc: "时断时续" },
  { key: "normal", emoji: "👌", label: "正常", desc: "没有特别" },
  { key: "other", emoji: "🤷", label: "其他", desc: "其他感受" },
];
```

- [ ] **Step 3: 在 FormState 接口中添加字段**

```tsx
    process_feeling: string;
```

- [ ] **Step 4: 在 form 初始状态中添加默认值**

```tsx
    process_feeling: record?.process_feeling ?? "",
```

- [ ] **Step 5: 在 handleSubmit 的 data 对象中添加**

```tsx
        process_feeling: (form.process_feeling as RecordCreate["process_feeling"]) || null,
```

- [ ] **Step 6: 在表单中添加 UI 区块（放在「身体感受」区块之后、「备注」区块之前）**

```tsx
      {/* 排便过程感受 — 卡片选择器 */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>
          <span>🚽</span> 排便过程感受
        </h3>
        <p className="text-xs text-muted-foreground -mt-1">
          选择最接近本次排便过程的体验
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROCESS_FEELING_OPTIONS.map((opt) => {
            const selected = form.process_feeling === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setForm({ ...form, process_feeling: selected ? "" : opt.key })}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 -translate-y-0.5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20"
                  }
                  active:scale-[0.96]
                `}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className={`text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  {opt.desc}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
```

- [ ] **Step 7: 验证——启动前端确认无编译错误**

```bash
cd src/frontend && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/frontend/src/components/records/RecordForm.tsx
git commit -m "feat: RecordForm 新增排便过程感受卡片选择器"
```

---

### Task 6: 前端流式分析——StreamingAnalysisCard + 页面集成

**Files:**
- Create: `src/frontend/src/components/analysis/StreamingAnalysisCard.tsx`
- Modify: `src/frontend/src/app/analysis/page.tsx`

**Interfaces:**
- Consumes: `analysesApi.stream()` from `@/lib/api`
- Produces: `StreamingAnalysisCard` component

- [ ] **Step 1: 创建 StreamingAnalysisCard.tsx**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analysesApi, type AnalysisRequest } from "@/lib/api";
import { Calendar, Lightbulb, Sparkles } from "lucide-react";

interface Props {
  dateFrom: string;
  dateTo: string;
  onComplete: () => void;
  onError: (err: string) => void;
}

export default function StreamingAnalysisCard({ dateFrom, dateTo, onComplete, onError }: Props) {
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let cancelled = false;

    analysesApi.stream(
      { date_from: dateFrom, date_to: dateTo },
      (chunk) => {
        if (!cancelled) setSummary((prev) => prev + chunk);
      },
      (sugs) => {
        if (!cancelled) setSuggestions(sugs);
      },
      () => {
        if (!cancelled) {
          setDone(true);
          onComplete();
        }
      },
      (err) => {
        if (!cancelled) {
          setError(err);
          onError(err);
        }
      },
    );

    return () => { cancelled = true; };
  }, [dateFrom, dateTo, onError]);

  useEffect(() => {
    // 自动滚动到最新内容
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  return (
    <Card className="animate-fade-in-up ring-2 ring-accent/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent animate-pulse" />
            {done ? "分析完成" : "AI 分析中..."}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-full">
            <Calendar size={11} />
            {dateFrom} ~ {dateTo}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="bg-destructive/10 rounded-xl p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {/* 流式摘要 */}
            <div className="bg-muted/30 rounded-xl p-4 min-h-[120px] max-h-[400px] overflow-y-auto" ref={summaryRef}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                分析摘要
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
                {!done && <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </p>
            </div>

            {/* 建议列表 */}
            {suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-accent" />
                  健康建议
                </h4>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm bg-accent/5 rounded-xl px-4 py-2.5"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 修改 analysis/page.tsx——集成流式输出**

在现有 `handleAnalyze` 函数旁新增流式分析触发器。在页面中添加 `StreamingAnalysisCard` 的导入和渲染。

在现有 import 中添加：
```tsx
import StreamingAnalysisCard from "@/components/analysis/StreamingAnalysisCard";
```

在 `handleAnalyze` 之后添加流式分析状态和处理函数：
```tsx
  const [streaming, setStreaming] = useState(false);

  const handleStreamAnalyze = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("请选择时间范围");
      return;
    }
    setStreaming(true);
  };

  const handleStreamDone = () => {
    setStreaming(false);
    // 流式完成后刷新分析列表
    analysesApi.list().then(setAnalyses).catch(() => {});
    toast.success("AI 分析完成！");
  };

  const handleStreamError = (err: string) => {
    setStreaming(false);
    toast.error(err);
  };
```

将「开始分析」按钮的处理函数从 `handleAnalyze` 改为流式：
```tsx
            <Button
              onClick={handleStreamAnalyze}
              disabled={analyzing || streaming}
              size="lg"
              className="gap-2 sm:shrink-0"
            >
```

在分析触发 Card 和历史列表之间插入流式输出区域：
```tsx
      {/* 流式分析输出 */}
      {streaming && (
        <StreamingAnalysisCard
          dateFrom={dateFrom}
          dateTo={dateTo}
          onComplete={handleStreamDone}
          onError={handleStreamError}
        />
      )}
```

- [ ] **Step 3: 验证——前端编译检查**

```bash
cd src/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/analysis/StreamingAnalysisCard.tsx src/frontend/src/app/analysis/page.tsx
git commit -m "feat: 前端流式 AI 分析——StreamingAnalysisCard 打字机效果输出"
```

---

### Task 7: 后端统计接口扩展——summary 汇总数据

**Files:**
- Modify: `src/backend/services/record_service.py`
- Modify: `src/backend/schemas.py`

**Interfaces:**
- Produces: `get_stats()` 返回值新增 `summary` dict
- Produces: `StatsResponse` schema 新增 `summary` 字段

- [ ] **Step 1: 修改 schemas.py——StatsResponse 加 summary**

```python
class StatsResponse(BaseModel):
    """统计响应"""
    frequency: list[dict]
    avg_duration: list[dict]
    shape_distribution: list[dict]
    summary: dict | None = None
```

- [ ] **Step 2: 修改 record_service.py——get_stats() 扩展**

在现有 `return` 语句前添加 summary 计算逻辑：

```python
    # 汇总统计
    total_count = (
        db.query(func.count(Record.id))
        .filter(Record.start_time >= cutoff)
        .scalar()
    )

    # 本周次数
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    this_week_count = (
        db.query(func.count(Record.id))
        .filter(Record.start_time >= week_start)
        .scalar()
    )

    # 全局平均时长
    avg_dur_row = (
        db.query(func.avg(Record.duration))
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    avg_duration_seconds = round(avg_dur_row, 1) if avg_dur_row else 0

    # 最常见形状
    most_common = (
        db.query(Record.shape, func.count(Record.id).label("cnt"))
        .filter(Record.shape.isnot(None), Record.start_time >= cutoff)
        .group_by(Record.shape)
        .order_by(func.count(Record.id).desc())
        .first()
    )

    # 形状中文标签映射
    shape_labels = {"1": "硬块状", "2": "香肠状", "3": "条状裂纹", "4": "光滑条状", "5": "软团状", "6": "糊状", "7": "水样状"}

    # 异常天数（颜色非棕色 或 形状为 1/2/6/7）
    abnormal_days = (
        db.query(func.count(func.distinct(func.date(Record.start_time))))
        .filter(
            Record.start_time >= cutoff,
            (Record.color.isnot(None) & (Record.color != "brown"))
            | (Record.shape.in_(["1", "2", "6", "7"])),
        )
        .scalar()
    ) or 0

    # 有记录的天数
    record_days = len(frequency) if frequency else 0

    # 日均频率
    avg_frequency_per_day = round(total_count / days, 1) if days > 0 else 0

    # 最长单次时长
    longest_row = (
        db.query(func.max(Record.duration))
        .filter(Record.start_time >= cutoff, Record.duration.isnot(None))
        .scalar()
    )
    longest_duration_seconds = round(longest_row, 1) if longest_row else 0

    # 最长连续打卡天数
    record_dates = [r.date for r in frequency]
    streak_days = 0
    if record_dates:
        from datetime import date as date_type
        streak_days = 1
        max_streak = 1
        sorted_dates = sorted(record_dates)
        for i in range(1, len(sorted_dates)):
            prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d").date()
            curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
            if (curr - prev).days == 1:
                streak_days += 1
                max_streak = max(max_streak, streak_days)
            else:
                streak_days = 1
        streak_days = max_streak

    summary = {
        "total_count": total_count or 0,
        "this_week_count": this_week_count or 0,
        "avg_duration_seconds": avg_duration_seconds,
        "most_common_shape": most_common.shape if most_common else None,
        "most_common_shape_label": shape_labels.get(most_common.shape, "未知") if most_common else None,
        "abnormal_days": abnormal_days,
        "avg_frequency_per_day": avg_frequency_per_day,
        "longest_duration_seconds": longest_duration_seconds,
        "record_days": record_days,
        "streak_days": streak_days,
    }
```

修改 return：
```python
    return {
        "frequency": [{"date": r.date, "count": r.count} for r in frequency],
        "avg_duration": [{"date": r.date, "avg_seconds": round(r.avg_seconds, 1)} for r in avg_duration],
        "shape_distribution": [{"shape": r.shape, "count": r.count} for r in shape_dist],
        "summary": summary,
    }
```

- [ ] **Step 3: 验证——后端导入检查**

```bash
cd src/backend && python -c "from services.record_service import get_stats; print('OK')"
```

- [ ] **Step 4: 扩展 test_calendar_stats.py——验证 summary 字段**

在 `test_stats_data` 函数末尾添加对 `summary` 字段的断言：

```python
def test_stats_summary_fields(client):
    """测试统计数据中的 summary 汇总字段"""
    records = [
        {"start_time": "2026-06-20T08:00:00", "duration": 300, "shape": "4", "color": "brown", "input_mode": "timer"},
        {"start_time": "2026-06-23T09:00:00", "duration": 180, "shape": "3", "color": "brown", "input_mode": "manual"},
        {"start_time": "2026-06-24T10:00:00", "duration": 600, "shape": "4", "color": "brown", "input_mode": "timer"},
    ]
    for r in records:
        client.post("/api/records", json=r)

    resp = client.get("/api/records/stats?days=7")
    assert resp.status_code == 200
    data = resp.json()
    summary = data["summary"]

    assert summary is not None
    assert summary["total_count"] == 3
    assert summary["avg_duration_seconds"] > 0
    assert summary["most_common_shape"] == "4"
    assert summary["most_common_shape_label"] is not None
    assert summary["record_days"] > 0
    assert "total_count" in summary
    assert "this_week_count" in summary
    assert "avg_frequency_per_day" in summary
    assert "longest_duration_seconds" in summary
    assert "streak_days" in summary
    assert "abnormal_days" in summary
```

- [ ] **Step 5: 运行测试验证**

```bash
cd src/backend && python -m pytest tests/test_calendar_stats.py -v
```
Expected: `test_stats_summary_fields` PASS，原有测试无回归（预计 ~3 tests passed）

- [ ] **Step 6: Commit**

```bash
git add src/backend/services/record_service.py src/backend/schemas.py src/backend/tests/test_calendar_stats.py
git commit -m "feat: 后端统计接口扩展——新增 summary 汇总数据（9个指标）"
```

---

### Task 8: 前端统计卡片组件 + 页面集成

**Files:**
- Create: `src/frontend/src/components/charts/StatsSummaryCards.tsx`
- Modify: `src/frontend/src/app/stats/page.tsx`
- Modify: `src/frontend/src/components/charts/StatsCharts.tsx`（数据接入）

**Interfaces:**
- Consumes: `StatsSummary` from `@/lib/types`
- Produces: `StatsSummaryCards` component

- [ ] **Step 1: 创建 StatsSummaryCards.tsx**

```tsx
import type { StatsSummary } from "@/lib/types";

interface Props {
  data: StatsSummary | null;
}

interface CardItem {
  key: string;
  icon: string;
  label: string;
  value: (d: StatsSummary) => string | number;
}

const CARDS: CardItem[] = [
  { key: "total", icon: "📋", label: "总记录", value: (d) => d.total_count },
  { key: "week", icon: "📅", label: "本周", value: (d) => d.this_week_count },
  { key: "avg_freq", icon: "📊", label: "日均", value: (d) => d.avg_frequency_per_day },
  { key: "streak", icon: "🔥", label: "连续打卡", value: (d) => `${d.streak_days}天` },
  { key: "avg_dur", icon: "⏱", label: "平均时长", value: (d) => formatDuration(d.avg_duration_seconds) },
  { key: "longest", icon: "🐢", label: "最长时长", value: (d) => formatDuration(d.longest_duration_seconds) },
  { key: "shape", icon: "💩", label: "常见形状", value: (d) => d.most_common_shape_label || "-" },
  { key: "abnormal", icon: "⚠️", label: "异常天数", value: (d) => d.abnormal_days },
  { key: "days", icon: "📆", label: "记录天数", value: (d) => d.record_days },
];

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}分${s}秒`;
}

export default function StatsSummaryCards({ data }: Props) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-card rounded-xl p-4 ring-1 ring-border/30 hover:ring-border/50 hover:shadow-md transition-all duration-200 flex flex-col gap-2"
        >
          <span className="text-2xl leading-none">{card.icon}</span>
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {card.value(data)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 修改 stats/page.tsx——集成卡片组件**

```tsx
import StatsCharts from "@/components/charts/StatsCharts";

export default function StatsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">数据统计</h1>
      <StatsCharts />
    </div>
  );
}
```

修改后：由于 StatsCharts 内部已有数据获取和处理逻辑，卡片集成将在 StatsCharts 内部完成。实际上 `StatsSummaryCards` 在 `StatsCharts.tsx` 中引入，放在三个图前面。

- [ ] **Step 3: 修改 StatsCharts.tsx——引入卡片组件**

在文件顶部 import 中添加：
```tsx
import StatsSummaryCards from "./StatsSummaryCards";
```

在返回的 JSX 中，范围选择器之后、第一个图表 Card 之前插入：
```tsx
      {/* 数据汇总卡片 */}
      <StatsSummaryCards data={data.summary} />
```

- [ ] **Step 4: 验证——前端编译检查**

```bash
cd src/frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/charts/StatsSummaryCards.tsx src/frontend/src/app/stats/page.tsx src/frontend/src/components/charts/StatsCharts.tsx
git commit -m "feat: 统计页面新增数据汇总卡片（9个指标，3列网格）"
```

---

### Task 9: 柱状图视觉增强——渐变 + 动画 + hover 效果

**Files:**
- Modify: `src/frontend/src/components/charts/StatsCharts.tsx`

**Interfaces:**
- Consumes: Recharts `BarChart`, `Bar`, `Tooltip` components

- [ ] **Step 1: 修改 StatsCharts.tsx 的柱状图部分**

将现有频率柱状图 Card 替换为增强版：

```tsx
      {/* 每日频率柱状图（增强版） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            每日记录次数
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.frequency.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.frequency} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 80)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.03 70)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0 / 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid oklch(0.90 0.02 80)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                  labelFormatter={freqLabelFormatter}
                  formatter={freqTooltipFormatter}
                  cursor={{ fill: "oklch(0.95 0.02 80)", radius: 8 }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
```

- [ ] **Step 2: 同样增强折线图 Tooltip——毛玻璃效果**

将折线图的 `<Tooltip>` 替换为与柱状图相同的自定义样式：
```tsx
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0 / 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid oklch(0.90 0.02 80)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    padding: "10px 14px",
                  }}
                  labelFormatter={freqLabelFormatter}
                  formatter={durationTooltipFormatter}
                />
```

- [ ] **Step 3: 同样增强饼图 Tooltip**

将饼图的 `<Tooltip>` 替换为相同的毛玻璃样式。

- [ ] **Step 4: 验证——前端启动查看效果**

```bash
cd src/frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/charts/StatsCharts.tsx
git commit -m "feat: 柱状图增强——渐变填充+毛玻璃Tooltip+入场动画+圆角"
```

---

## 部署检查

- [ ] 全量测试通过：`cd src/backend && python -m pytest tests/ -v`
- [ ] 后端 `.env` 文件按新格式配置好 LLM 参数
- [ ] 前端 `NEXT_PUBLIC_API_URL` 指向正确后端地址
- [ ] 数据库自动建表（process_feeling 列通过 lifespan 自动添加）
- [ ] 流式分析端点在无 LLM API key 时返回合理错误
