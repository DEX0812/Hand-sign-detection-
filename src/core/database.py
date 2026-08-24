import sqlite3
import hashlib
import time
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def init_db():
    """Initialize SQLite database schema."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            trial_start INTEGER NOT NULL,
            sub_plan TEXT DEFAULT 'none',
            sub_end INTEGER DEFAULT 0,
            sub_status TEXT DEFAULT 'none'
        )
    """)
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def hash_password(password: str) -> str:
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_user(username: str, email: str, password: str):
    """Create a new user with a 1-day free trial."""
    init_db()  # Ensure database is created
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    p_hash = hash_password(password)
    trial_start = int(time.time())
    
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, trial_start) VALUES (?, ?, ?, ?)",
            (username, email, p_hash, trial_start)
        )
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    finally:
        conn.close()
        
    return success

def authenticate_user(username: str, password: str) -> bool:
    """Verify credentials."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    p_hash = hash_password(password)
    
    cursor.execute(
        "SELECT id FROM users WHERE username = ? AND password_hash = ?",
        (username, p_hash)
    )
    user = cursor.fetchone()
    conn.close()
    return user is not None

def get_user_status(username: str) -> dict:
    """Get subscription and trial details for a user."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT email, trial_start, sub_plan, sub_end, sub_status FROM users WHERE username = ?",
        (username,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    user = dict(row)
    now = int(time.time())
    
    # Calculate free trial status
    trial_duration = 24 * 60 * 60  # 1 day in seconds
    trial_elapsed = now - user["trial_start"]
    trial_remaining = max(0, trial_duration - trial_elapsed)
    is_trial_active = trial_remaining > 0
    
    # Calculate subscription status
    is_sub_active = False
    if user["sub_status"] == "active" and user["sub_end"] > now:
        is_sub_active = True
    elif user["sub_status"] == "cancelled" and user["sub_end"] > now:
        is_sub_active = True # Still active until period ends
        
    return {
        "username": username,
        "email": user["email"],
        "trial_start": user["trial_start"],
        "trial_remaining": trial_remaining,
        "is_trial_active": is_trial_active,
        "sub_plan": user["sub_plan"],
        "sub_end": user["sub_end"],
        "sub_status": user["sub_status"],
        "is_sub_active": is_sub_active,
        "has_access": is_trial_active or is_sub_active
    }

def update_subscription(username: str, plan: str, duration_days: int) -> bool:
    """Purchase a subscription and update user records."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = int(time.time())
    sub_end = now + (duration_days * 24 * 60 * 60)
    
    cursor.execute(
        "UPDATE users SET sub_plan = ?, sub_end = ?, sub_status = 'active' WHERE username = ?",
        (plan, sub_end, username)
    )
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def cancel_subscription(username: str) -> bool:
    """Cancel subscription (will expire at the end of duration)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE users SET sub_status = 'cancelled' WHERE username = ?",
        (username,)
    )
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def simulate_expiry(username: str) -> bool:
    """Simulate trial and subscription expiry for testing."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Set trial_start to 2 days ago (trial expired) and sub_end to 0
    trial_start = int(time.time()) - (2 * 24 * 60 * 60)
    
    cursor.execute(
        "UPDATE users SET trial_start = ?, sub_plan = 'none', sub_end = 0, sub_status = 'none' WHERE username = ?",
        (trial_start, username)
    )
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0
