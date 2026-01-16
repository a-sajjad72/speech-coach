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
                created_at TEXT NOT NULL,
                topic TEXT,
                language TEXT,
                model TEXT
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

    def add_session(self, session_id: str, mode: str, topic: str = None, language: str = None, model: str = None):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO sessions (id, mode, created_at, topic, language, model) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, mode, datetime.utcnow().isoformat(), topic, language, model),
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

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """Get all sessions with message count and duration stats."""
        cur = self.conn.cursor()
        rows = cur.execute(
            """
            SELECT 
                s.id,
                s.mode,
                s.created_at,
                s.topic,
                s.language,
                s.model,
                COUNT(m.id) as message_count,
                MIN(m.created_at) as first_message,
                MAX(m.created_at) as last_message
            FROM sessions s
            LEFT JOIN messages m ON s.id = m.session_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]

    def update_session_metadata(self, session_id: str, topic: str = None, language: str = None, model: str = None):
        """Update session metadata (topic, language, model)."""
        cur = self.conn.cursor()
        updates = []
        params = []
        
        if topic is not None:
            updates.append("topic = ?")
            params.append(topic)
        if language is not None:
            updates.append("language = ?")
            params.append(language)
        if model is not None:
            updates.append("model = ?")
            params.append(model)
        
        if updates:
            params.append(session_id)
            query = f"UPDATE sessions SET {', '.join(updates)} WHERE id = ?"
            cur.execute(query, params)
            self.conn.commit()

    def delete_session(self, session_id: str):
        """Delete a session and all its messages."""
        cur = self.conn.cursor()
        # Delete messages first (foreign key constraint)
        cur.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
        # Delete session
        cur.execute("DELETE FROM sessions WHERE id=?", (session_id,))
        self.conn.commit()

