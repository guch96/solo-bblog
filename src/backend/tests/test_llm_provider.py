"""LLM Provider 测试"""
from services.llm_provider import LLMProvider, OpenAIProvider, get_provider


class MockOpenAIProvider(LLMProvider):
    """模拟 Provider 用于测试"""
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        return {
            "summary": f"分析了 {len(records)} 条记录",
            "suggestions": ["多喝水", "多吃纤维"],
            "model": "mock-model",
            "provider": "mock_provider",
        }


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


def test_get_provider_openai(monkeypatch):
    """测试根据配置获取 OpenAI provider"""
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    provider = get_provider()
    assert isinstance(provider, OpenAIProvider)
    assert provider.model == "gpt-4o-mini"


def test_get_provider_unknown_fallback(monkeypatch):
    """测试未知 provider 回退到 OpenAI"""
    monkeypatch.setenv("LLM_PROVIDER", "unknown")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    provider = get_provider()
    assert isinstance(provider, OpenAIProvider)
