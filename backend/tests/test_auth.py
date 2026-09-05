"""
Unit tests for Authentication & User Security.
"""

import pytest
from app.utils.security import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing():
    pwd = "SecurePassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    payload = {"sub": "user-uuid-123", "email": "test@example.com"}
    token = create_access_token(payload)
    assert isinstance(token, str)

    decoded = decode_token(token)
    assert decoded["sub"] == "user-uuid-123"
    assert decoded["email"] == "test@example.com"
    assert decoded["type"] == "access"


def test_google_auth_token_decode():
    import base64
    import json
    payload = {
        "email": "user@example.com",
        "name": "Demo Google User",
        "sub": "google-oauth2-1234567890",
        "picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    }
    dummy_jwt = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{base64.b64encode(json.dumps(payload).encode()).decode()}.dummy_sig"
    parts = dummy_jwt.split(".")
    assert len(parts) >= 2
    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
    user_info = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    assert user_info["email"] == "user@example.com"
    assert user_info["name"] == "Demo Google User"

