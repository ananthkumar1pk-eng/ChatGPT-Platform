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
