"""AI 分析 API 测试"""
from unittest.mock import patch, MagicMock


def test_create_analysis(client, auth_headers):
    """测试触发 AI 分析"""
    for i in range(3):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "shape": "4",
            "input_mode": "timer",
        }, headers=auth_headers)

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
        }, headers=auth_headers)

    assert resp.status_code == 201
    data = resp.json()
    assert "测试摘要" in data["summary"]


def test_get_analyses(client, auth_headers):
    """测试获取分析历史"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    }, headers=auth_headers)

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
        }, headers=auth_headers)

    resp = client.get("/api/analyses", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_analysis_detail(client, auth_headers):
    """测试获取单条分析详情"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    }, headers=auth_headers)

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
        }, headers=auth_headers)

    resp = client.get("/api/analyses/1", headers=auth_headers)
    assert resp.status_code == 200
    assert "summary" in resp.json()


def test_analysis_no_records(client, auth_headers):
    """测试无记录时分析返回 400"""
    resp = client.post("/api/analyses", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_analysis_uses_server_local_date_range(client, auth_headers):
    """测试分析按服务器本地日期范围筛选"""
    client.post("/api/records", json={
        "start_time": "2026-06-25T02:30:00",
        "input_mode": "timer",
    }, headers=auth_headers)

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.analyze.return_value = {
        "summary": "本地日期分析成功",
        "suggestions": [],
        "model": "mock-model",
        "provider": "mock_provider",
    }

    with patch("services.analysis_service.get_provider", return_value=mock_provider):
        resp = client.post("/api/analyses", json={
            "date_from": "2026-06-25",
            "date_to": "2026-06-25",
        }, headers=auth_headers)

    assert resp.status_code == 201
    assert "本地日期分析成功" in resp.json()["summary"]


def test_analysis_stream_sse_format(client, auth_headers):
    """测试流式分析返回 SSE 格式数据"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    }, headers=auth_headers)

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
        }, headers=auth_headers)

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    body = resp.text
    assert 'data: {"type":"summary_chunk"' in body
    assert 'data: {"type":"done"}' in body


def test_analysis_stream_no_records(client, auth_headers):
    """测试流式分析无记录时返回 400"""
    resp = client.post("/api/analyses/stream", json={
        "date_from": "2026-06-24",
        "date_to": "2026-06-24",
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_analysis_stream_persists_before_done_event(client, auth_headers):
    """测试流式分析在返回 done 事件前已持久化新记录"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "timer",
    }, headers=auth_headers)

    mock_provider = MagicMock()
    mock_provider.model = "mock-model"
    mock_provider.provider_name = "mock_provider"
    mock_provider.analyze_stream.return_value = iter([
        'data: {"type":"summary_chunk","content":"新的分析摘要"}\n\n',
        'data: {"type":"suggestions","content":["建议A"]}\n\n',
        'data: {"type":"done"}\n\n',
    ])

    with patch("routers.analyses.get_provider", return_value=mock_provider):
        resp = client.post("/api/analyses/stream", json={
            "date_from": "2026-06-24",
            "date_to": "2026-06-24",
        }, headers=auth_headers)

    assert resp.status_code == 200
    analyses_resp = client.get("/api/analyses", headers=auth_headers)
    data = analyses_resp.json()
    assert len(data) == 1
    assert data[0]["summary"] == "新的分析摘要"
