import requests

def verify():
    # Login
    login_resp = requests.post("http://localhost:8001/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "ChangeMe123!"
    })
    token = login_resp.json()["access_token"]
    
    # Get flags
    flags_resp = requests.get("http://localhost:8001/api/v1/flags", headers={
        "Authorization": f"Bearer {token}"
    })
    
    flags = flags_resp.json()
    print(f"Found {len(flags)} flags")
    for f in flags:
        print(f"[{f['source']}] Score: {f['suspicion_score']} - {f['threat_category']}")

if __name__ == "__main__":
    verify()
