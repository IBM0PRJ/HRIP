from fastapi.testclient import TestClient

from services.gateway.app.main import app


def test_login_rejects_bad_credentials() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "wrong"},
        )
    assert response.status_code == 401
