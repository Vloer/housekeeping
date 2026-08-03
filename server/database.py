import sqlite3
from config import DB_PATH

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS households (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        join_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        household_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        default_frequency_days INTEGER NOT NULL DEFAULT 30,
        FOREIGN KEY(household_id) REFERENCES households(id)
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS active_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        household_id INTEGER NOT NULL,
        catalog_task_id INTEGER NOT NULL,
        frequency_days INTEGER NOT NULL,
        last_done_date TEXT,
        notified_this_cycle INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(household_id) REFERENCES households(id),
        FOREIGN KEY(catalog_task_id) REFERENCES task_catalog(id)
    )
    """)
    conn.commit()
    conn.close()
