import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import Request, HTTPException, status
from database.db import query_one

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "civicsutra-secure-signing-secret-key-ward14-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verifies a plaintext password against the stored salt:hash string."""
    if not hashed_password or ":" not in hashed_password:
        return False
    try:
        salt, key = hashed_password.split(":")
        new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), bytes.fromhex(salt), 100000)
        return secrets.compare_digest(key, new_key.hex())
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token with expiration."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def extract_token_from_header(request: Request) -> Optional[str]:
    """Extracts bearer token from Authorization header or cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None

def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """Retrieves current user if valid authorization token is present, else None."""
    token = extract_token_from_header(request)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user = query_one("SELECT id, name, email, role, preferred_language, account_status, phone FROM users WHERE id = ?;", (payload["sub"],))
    return dict(user) if user else None

def get_current_user(request: Request) -> Dict[str, Any]:
    """Dependency that enforces a valid authenticated user session."""
    user = get_optional_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.get("account_status") != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active.")
    return user

def require_admin(request: Request) -> Dict[str, Any]:
    """Dependency that enforces verified ADMIN role on the server."""
    user = get_current_user(request)
    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required. Access denied."
        )
    return user

def require_authorized_staff(request: Request) -> Dict[str, Any]:
    """Dependency that enforces ADMIN or FIELD_TEAM role on the server."""
    user = get_current_user(request)
    if user.get("role") not in ("ADMIN", "FIELD_TEAM"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or administrative privileges required. Access denied."
        )
    return user
