import sqlite3
import os
import json
from pathlib import Path
from typing import Any, List, Dict, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "civicsutra.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db(force_reset: bool = False):
    """Applies schema.sql migrations and seeds initial data if empty."""
    if force_reset and DB_PATH.exists():
        try:
            DB_PATH.unlink()
        except Exception as e:
            print(f"Warning unlinking DB: {e}")

    conn = get_connection()
    try:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()

        # Check and add missing columns if needed
        cursor = conn.cursor()
        cols = [c[1] for c in cursor.execute("PRAGMA table_info(users);").fetchall()]
        if "password_hash" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT;")
        if "phone" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT;")
        conn.commit()

        # Check if users table is populated
        cursor.execute("SELECT COUNT(*) as count FROM users;")
        user_count = cursor.fetchone()["count"]

        # Resilient hash_password import
        try:
            from core.security import hash_password
        except ImportError:
            try:
                from app.core.security import hash_password
            except ImportError:
                import hashlib, secrets
                def hash_password(password: str) -> str:
                    salt = secrets.token_hex(16)
                    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000)
                    return f"{salt}:{key.hex()}"

        if user_count == 0 or force_reset:
            from database.seed_data import seed_database
            seed_database(conn)
        else:
            # Backfill password hashes and phones for seeded users if empty
            cursor.execute("SELECT id, email, role, password_hash, phone FROM users;")
            existing_users = cursor.fetchall()
            for u in existing_users:
                if not u["password_hash"]:
                    default_pw = "Admin@123" if u["role"] == "ADMIN" else ("Field@123" if u["role"] == "FIELD_TEAM" else "Citizen@123")
                    phone_val = "+91 98111 22334" if u["role"] == "ADMIN" else ("+91 98222 33445" if u["role"] == "FIELD_TEAM" else "+91 98765 43210")
                    cursor.execute(
                        "UPDATE users SET password_hash = ?, phone = COALESCE(phone, ?) WHERE id = ?;",
                        (hash_password(default_pw), phone_val, u["id"])
                    )
            
            # Ensure a second citizen exists for multi-user testing
            cursor.execute("SELECT id FROM users WHERE email = 'priya@civicsutra.org';")
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (id, name, email, role, password_hash, phone, preferred_language, created_at, account_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE');
                """, (
                    "usr-citizen-02", "Priya Patel", "priya@civicsutra.org", "CITIZEN",
                    hash_password("Citizen@123"), "+91 98123 45678", "en"
                ))

            # Ensure report CS-2026-1006 is owned by Priya Patel
            cursor.execute("UPDATE reports SET submitted_by = 'usr-citizen-02', citizen_name = 'Priya Patel' WHERE id = 'CS-2026-1006';")
            conn.commit()
    finally:
        conn.close()

# Auto-apply schema migration on module load
try:
    init_db(force_reset=False)
except Exception:
    pass

def query_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def query_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def execute_commit(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()
