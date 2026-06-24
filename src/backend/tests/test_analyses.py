"""AI 分析 API 测试"""
from unittest.mock import patch


def test_create_analysis(client):
    """测试触发 AI 分析"""
    for i in range(3):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "shape": "4",
            "input_mode": "timer",
        })

    with patch("services.analysis_service.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
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

    with patch("services.analysis_service.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
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

    with patch("services.analysis_service.get_provider") as mock_get_provider:
        from services.llm_provider import MockOpenAIProvider
        mock_get_provider.return_value = MockOpenAIProvider("mock-model")
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
