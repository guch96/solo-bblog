"""日历热力图 + 统计 API 测试"""


def test_calendar_data(client, auth_headers):
    """测试日历热力图数据"""
    # 创建两条同一天的记录
    for i in range(2):
        client.post("/api/records", json={
            "start_time": "2026-06-24T08:00:00",
            "input_mode": "manual",
        }, headers=auth_headers)
    # 创建一条第二天记录
    client.post("/api/records", json={
        "start_time": "2026-06-25T10:00:00",
        "input_mode": "timer",
    }, headers=auth_headers)

    resp = client.get("/api/records/calendar?month=2026-06", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    # 应该有 6/24 和 6/25 两天
    dates = {d["date"] for d in data}
    assert "2026-06-24" in dates
    assert "2026-06-25" in dates
    # 6/24 应该有 2 条记录
    day_24 = next(d for d in data if d["date"] == "2026-06-24")
    assert day_24["count"] == 2


def test_calendar_data_uses_server_local_date(client, auth_headers):
    """测试日历按服务器本地日期分组"""
    client.post(
        "/api/records",
        json={
            "start_time": "2026-06-25T02:30:00",
            "input_mode": "manual",
        },
        headers=auth_headers,
    )

    resp = client.get("/api/records/calendar?month=2026-06", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    day_25 = next(d for d in data if d["date"] == "2026-06-25")
    assert day_25["count"] == 1


def test_stats_data(client, auth_headers):
    """测试统计数据"""
    # 创建不同形状的记录
    records = [
        {"start_time": "2026-06-20T08:00:00", "duration": 300, "shape": "4", "input_mode": "timer"},
        {"start_time": "2026-06-23T09:00:00", "duration": 180, "shape": "3", "input_mode": "manual"},
        {"start_time": "2026-06-24T10:00:00", "duration": 600, "shape": "4", "input_mode": "timer"},
    ]
    for r in records:
        client.post("/api/records", json=r, headers=auth_headers)

    resp = client.get("/api/records/stats?days=7", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "frequency" in data
    assert "avg_duration" in data
    assert "shape_distribution" in data
    # 形状分布: type_4 应该有 2 条
    shapes = {s["shape"]: s["count"] for s in data["shape_distribution"]}
    assert shapes["4"] == 2
    assert shapes["3"] == 1


def test_stats_summary_fields(client, auth_headers):
    """测试统计数据中的 summary 汇总字段"""
    records = [
        {"start_time": "2026-06-20T08:00:00", "duration": 300, "shape": "4", "color": "brown", "input_mode": "timer"},
        {"start_time": "2026-06-23T09:00:00", "duration": 180, "shape": "3", "color": "brown", "input_mode": "manual"},
        {"start_time": "2026-06-24T10:00:00", "duration": 600, "shape": "4", "color": "brown", "input_mode": "timer"},
    ]
    for r in records:
        client.post("/api/records", json=r, headers=auth_headers)

    resp = client.get("/api/records/stats?days=7", headers=auth_headers)
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
