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
