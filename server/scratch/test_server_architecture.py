import sys
import os

server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from fastapi.testclient import TestClient
from main import app
from core.config import API_AUTH_TOKEN

client = TestClient(app)
headers = {"Authorization": f"Bearer {API_AUTH_TOKEN}"}

def test_server_architecture():
    print("[1/5] Testing Root endpoint...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("  ROOT OK:", res.json())

    print("[2/5] Creating test household via HouseholdService...")
    create_res = client.post("/api/households/create", json={
        "name": "Clean Architecture Mansion",
        "user_name": "Alice",
        "user_uuid": "uuid-clean-arch-001"
    }, headers=headers)
    assert create_res.status_code == 200, f"Expected 200, got {create_res.status_code}: {create_res.text}"
    household_data = create_res.json()
    print("  CREATE HOUSEHOLD OK:", household_data)
    h_id = household_data["household_id"]
    code = household_data["join_code"]

    print("[3/5] Testing Check Join & Join Household...")
    check_res = client.post("/api/households/check-join", json={
        "join_code": code,
        "user_uuid": "uuid-clean-arch-001"
    }, headers=headers)
    assert check_res.status_code == 200
    assert check_res.json()["is_member"] == True
    print("  CHECK JOIN OK:", check_res.json())

    print("[4/5] Testing Catalog & Active Tasks...")
    catalog_res = client.get(f"/api/households/{h_id}/catalog", headers=headers)
    assert catalog_res.status_code == 200
    catalog = catalog_res.json()
    assert len(catalog) > 0
    print(f"  CATALOG OK: {len(catalog)} items")

    cat_item_id = catalog[0]["id"]
    act_res = client.post(f"/api/households/{h_id}/activate", json={
        "catalog_task_id": cat_item_id,
        "frequency_days": 7
    }, headers=headers)
    assert act_res.status_code == 200

    active_res = client.get(f"/api/households/{h_id}/active", headers=headers)
    assert active_res.status_code == 200
    active = active_res.json()
    assert len(active) > 0
    print("  ACTIVE TASKS OK:", active)

    active_task_id = active[0]["id"]

    print("[5/5] Testing Mark Task Done & Highscores...")
    done_res = client.post(f"/api/active-tasks/{active_task_id}/mark-done", json={
        "user_uuid": "uuid-clean-arch-001"
    }, headers=headers)
    assert done_res.status_code == 200
    print("  MARK DONE OK:", done_res.json())

    scores_res = client.get(f"/api/highscores/household/{h_id}", headers=headers)
    assert scores_res.status_code == 200
    print("  HIGHSCORES OK:", scores_res.json())

    print("\nALL CLEAN ARCHITECTURE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_server_architecture()
