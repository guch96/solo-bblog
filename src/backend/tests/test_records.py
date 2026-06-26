"""记录 API 测试"""


def test_create_record(client, auth_headers):
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
    resp = client.post("/api/records", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == 1
    assert data["shape"] == "4"
    assert data["input_mode"] == "timer"


def test_get_records(client, auth_headers):
    """测试获取记录列表"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.get("/api/records", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_records_by_beijing_date(client, auth_headers):
    """测试按北京时间日期筛选记录"""
    client.post(
        "/api/records",
        json={"start_time": "2026-06-24T18:30:00Z", "input_mode": "manual"},
        headers=auth_headers,
    )

    resp = client.get("/api/records?date_from=2026-06-25&date_to=2026-06-25", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["start_time"].startswith("2026-06-24T18:30:00")


def test_get_record_by_id(client, auth_headers):
    """测试获取单条记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.get("/api/records/1", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1


def test_update_record(client, auth_headers):
    """测试更新记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    update = {"shape": "2", "notes": "感觉不太对"}
    resp = client.put("/api/records/1", json=update, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["shape"] == "2"
    assert resp.json()["notes"] == "感觉不太对"


def test_delete_record(client, auth_headers):
    """测试删除记录"""
    payload = {"start_time": "2026-06-24T08:00:00", "input_mode": "manual"}
    client.post("/api/records", json=payload, headers=auth_headers)
    resp = client.delete("/api/records/1", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get("/api/records/1", headers=auth_headers)
    assert resp.status_code == 404


def test_create_record_with_process_feeling(client, auth_headers):
    """测试创建包含排便过程感受的记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00", "input_mode": "timer",
        "process_feeling": "smooth",
    }
    resp = client.post("/api/records", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["process_feeling"] == "smooth"


def test_create_record_without_process_feeling(client, auth_headers):
    """测试不填过程感受也能创建记录"""
    payload = {
        "start_time": "2026-06-24T08:00:00",
        "input_mode": "manual",
    }
    resp = client.post("/api/records", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["process_feeling"] is None


def test_update_record_process_feeling(client, auth_headers):
    """测试更新排便过程感受"""
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00", "input_mode": "manual",
    }, headers=auth_headers)
    resp = client.put("/api/records/1", json={"process_feeling": "urgent"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["process_feeling"] == "urgent"


def test_record_has_all_process_feeling_values(client, auth_headers):
    """测试所有过程感受枚举值都能正确存储"""
    values = ["smooth", "urgent", "straining", "incomplete", "intermittent", "normal", "other"]
    for v in values:
        payload = {"start_time": "2026-06-24T08:00:00", "process_feeling": v, "input_mode": "manual"}
        resp = client.post("/api/records", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["process_feeling"] == v


def test_record_unauthorized(client):
    """测试未登录时访问需要鉴权的端点返回 401"""
    resp = client.get("/api/records")
    assert resp.status_code == 401 or resp.status_code == 403


def test_record_user_isolation(client, auth_headers):
    """测试用户数据隔离：用户 A 的记录不被用户 B 访问"""
    # 用户 testuser 创建一条记录
    client.post("/api/records", json={
        "start_time": "2026-06-24T08:00:00", "input_mode": "manual",
    }, headers=auth_headers)

    # 注册另一个用户并创建记录
    client.post("/api/auth/register", json={"username": "other", "password": "123456"})
    resp2 = client.post("/api/auth/login", json={"username": "other", "password": "123456"})
    other_token = resp2.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # other 用户看不到 testuser 的记录
    resp = client.get("/api/records", headers=other_headers)
    assert len(resp.json()) == 0

    # testuser 仍然能看到自己的记录
    resp = client.get("/api/records", headers=auth_headers)
    assert len(resp.json()) == 1
