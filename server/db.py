import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from .config import DB_PATH


class Database:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self):
        cur = self.conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                mode TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT,
                audio_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            )
            """
        )
        self.conn.commit()

    def add_session(self, session_id: str, mode: str):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO sessions (id, mode, created_at) VALUES (?, ?, ?)",
            (session_id, mode, datetime.utcnow().isoformat()),
        )
        self.conn.commit()

    def add_message(self, session_id: str, sender: str, text: str, audio_path: Optional[str] = None):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO messages (session_id, sender, text, audio_path, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, sender, text, audio_path, datetime.utcnow().isoformat()),
        )
        self.conn.commit()

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        rows = cur.execute(
            "SELECT id, session_id, sender, text, audio_path, created_at FROM messages WHERE session_id=? ORDER BY id",
            (session_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    def session_exists(self, session_id: str) -> bool:
        cur = self.conn.cursor()
        row = cur.execute("SELECT 1 FROM sessions WHERE id=?", (session_id,)).fetchone()
        return row is not None


