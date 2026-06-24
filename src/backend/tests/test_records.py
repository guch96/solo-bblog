"""记录 API 测试"""


def test_create_record(client):
    """测试创建记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "end_time": "2026-06-24T08:10:00",
        "duration": 600,
        "shape": "4",
        "color": "brown",
        "smell": "normal",
        "comfort": "comfortable",
        "notes": "正常",
        "input_mode": "timer",
    }
    resp = client.post("/api/records", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == 1
    assert data["shape"] == "4"
    assert data["input_mode"] == "timer"


def test_get_records(client):
    """测试获取记录列表"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.get("/api/records")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


def test_get_record_by_id(client):
    """测试获取单条记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.get("/api/records/1")
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


def test_update_record(client):
    """测试更新记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    update = {"shape": "2", "notes": "感觉不太对"}
    resp = client.put("/api/records/1", json=update)
    assert resp.status_code == 200
    assert resp.json()["shape"] == "2"
    assert resp.json()["notes"] == "感觉不太对"


def test_delete_record(client):
    """测试删除记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    client.post("/api/records", json=payload)
    resp = client.delete("/api/records/1")
    assert resp.status_code == 204
    # 确认已删除
    resp = client.get("/api/records/1")
    assert resp.status_code == 404
