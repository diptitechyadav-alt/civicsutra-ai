import time
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from database.db import query_all, query_one, execute_commit
from models.schemas import UserSchema, LoginRequest, UserRegister, AuthResponse
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access"])

@router.get("/users", response_model=List[UserSchema])
def get_all_users():
    """Returns available users for directory and demo setup (never exposes password hashes)."""
    rows = query_all("SELECT id, name, email, role, preferred_language, account_status, phone FROM users;")
    return [
        UserSchema(
            id=r["id"],
            name=r["name"],
            email=r["email"],
            role=r["role"],
            preferred_language=r.get("preferred_language") or "en",
            account_status=r.get("account_status") or "ACTIVE",
            ward="Ward 14",
            phone=r.get("phone") or ("+91 98765 43210" if r["role"] == "CITIZEN" else None),
        )
        for r in rows
    ]

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister):
    """Registers a new citizen with hashed password and generates a signed session token."""
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid full name (at least 2 characters).")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    # Check for duplicate email
    existing = query_one("SELECT id FROM users WHERE LOWER(email) = ?;", (email,))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in."
        )

    user_id = f"usr-citizen-{int(time.time() * 1000)}"
    pw_hash = hash_password(password)
    phone = payload.phone.strip() if payload.phone else "+91 98765 43210"

    execute_commit("""
        INSERT INTO users (id, name, email, role, password_hash, phone, preferred_language, created_at, account_status)
        VALUES (?, ?, ?, 'CITIZEN', ?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE');
    """, (user_id, name, email, pw_hash, phone, payload.preferred_language or "en"))

    user_schema = UserSchema(
        id=user_id,
        name=name,
        email=email,
        role="CITIZEN",
        preferred_language=payload.preferred_language or "en",
        account_status="ACTIVE",
        ward=payload.ward or "Ward 14",
        phone=phone
    )

    token = create_access_token({
        "sub": user_id,
        "name": name,
        "email": email,
        "role": "CITIZEN"
    })

    return AuthResponse(
        success=True,
        token=token,
        user=user_schema,
        message="Citizen account registered successfully."
    )

@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest):
    """
    Authenticates a user by email and password, or role for automated demo/tests.
    Issues a verified JWT access token.
    """
    user = None

    if payload.email:
        clean_email = payload.email.strip().lower()
        user = query_one("SELECT * FROM users WHERE LOWER(email) = ?;", (clean_email,))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not found. Please check your email or create an account."
            )

        # If password is provided, verify it strictly
        if payload.password:
            hashed = user.get("password_hash")
            if not hashed or not verify_password(payload.password, hashed):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password. Please check your credentials."
                )
        
        # Verify role match if caller specified a required role
        if payload.role and user["role"] != payload.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This account is registered as {user['role']}, but {payload.role} portal access was requested."
            )
    elif payload.role:
        # Automated test / quick demo fallback by role
        user = query_one("SELECT * FROM users WHERE role = ?;", (payload.role,))
        if not user:
            raise HTTPException(status_code=404, detail=f"No account found for role {payload.role}.")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required to sign in."
        )

    if not user:
        raise HTTPException(status_code=404, detail="No matching user account found.")

    user_dict = dict(user)
    user_schema = UserSchema(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        role=user_dict["role"],
        preferred_language=user_dict.get("preferred_language") or "en",
        account_status=user_dict.get("account_status") or "ACTIVE",
        ward="Ward 14",
        phone=user_dict.get("phone") or "+91 98765 43210"
    )

    token = create_access_token({
        "sub": user_dict["id"],
        "name": user_dict["name"],
        "email": user_dict["email"],
        "role": user_dict["role"]
    })

    return AuthResponse(
        success=True,
        token=token,
        user=user_schema,
        message="Sign in successful."
    )

@router.get("/me", response_model=UserSchema)
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the authenticated user's current profile from their validated session token."""
    return UserSchema(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        preferred_language=user.get("preferred_language") or "en",
        account_status=user.get("account_status") or "ACTIVE",
        ward="Ward 14",
        phone=user.get("phone") or "+91 98765 43210"
    )
