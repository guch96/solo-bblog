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
    monkeypatch.setenv("LLM_PROVIDER_NAME", "deepseek")
    provider = get_provider()
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.model == "gpt-4o"
    assert provider.api_key == "test-key"
    assert provider.base_url == "https://custom.api.com/v1"
    assert provider.temperature == 0.3
    assert provider.max_tokens == 4096
    assert provider.provider_name == "deepseek"
