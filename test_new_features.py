import requests
import time

def test_features():
    print("Starting tests...")
    
    # Base URLs from within the `api` container
    API_URL = "http://localhost:8000/api/v1"
    RISK_URL = "http://risk:8004/api/v1"
    GATEWAY_URL = "http://gateway:8001/api/v1"

    # 1. Login to get token
    print("1. Logging in...")
    res = requests.post(f"{GATEWAY_URL}/auth/login", json={
        "email": "admin@example.com",
        "password": "ChangeMe123!"
    })
    if res.status_code != 200:
        print(f"Login failed: {res.status_code} {res.text}")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Login successful.")

    # 2. Get users
    print("\n2. Fetching users...")
    res = requests.get(f"{API_URL}/users", headers=headers)
    users = res.json()
    if not users:
        print("No users found!")
        return
    
    # Pick a non-admin user
    employee = next((u for u in users if u["email"] != "admin@example.com"), users[0])
    print(f"   Picked employee: {employee['full_name']} ({employee['email']}) - Current Risk: {employee['risk_score']}")

    # 3. Get training modules
    print("\n3. Fetching training modules...")
    res = requests.get(f"{API_URL}/training/modules", headers=headers)
    modules = res.json()
    print(f"   Found {len(modules)} training modules.")
    if not modules:
        print("No modules available to assign.")
        return
    
    target_module = modules[0]
    print(f"   Target module: {target_module['title']}")

    # 4. Assign training
    print("\n4. Assigning training module...")
    res = requests.post(f"{API_URL}/training/assignments", headers=headers, json={
        "user_id": employee["id"],
        "module_id": target_module["id"]
    })
    
    if res.status_code == 200:
        print("   Assignment successful!")
    else:
        print(f"   Failed to assign: {res.status_code} {res.text}")
    
    # 5. Check assignments
    print("\n5. Checking assignments...")
    res = requests.get(f"{API_URL}/training/assignments/{employee['id']}", headers=headers)
    assignments = res.json()
    print(f"   User has {len(assignments)} assignments.")
    for a in assignments:
        print(f"   - {a['module']['title']} (Passed: {a['passed']})")

    # 6. Override risk score
    new_score = 42.0
    print(f"\n6. Overriding risk score to {new_score}...")
    admin_user = next((u for u in users if u["email"] == "admin@example.com"), users[0])
    
    res = requests.post(f"{RISK_URL}/risk/override", json={
        "user_id": employee["id"],
        "new_score": new_score,
        "reason": "Testing override functionality via test script.",
        "analyst_id": admin_user["id"]
    })
    if res.status_code == 200:
        print("   Override successful!")
    else:
        print(f"   Override failed: {res.status_code} {res.text}")
        
    # 7. Verify new risk score
    print("\n7. Verifying new risk score...")
    res = requests.get(f"{API_URL}/users/{employee['id']}/profile", headers=headers)
    profile = res.json()
    updated_score = profile["user"]["risk_score"]
    print(f"   Updated score in profile: {updated_score}")
    if updated_score == new_score:
        print("   ✅ Score override verified!")
    else:
        print("   ❌ Score override mismatch!")

    # Check risk history
    history = profile.get("risk_history", [])
    if history and history[0]["score"] == new_score:
        print("   ✅ Risk event found in history!")
    else:
        print("   ❌ Risk event not found in history at top!")
        
    print("\nAll tests completed!")

if __name__ == "__main__":
    test_features()
