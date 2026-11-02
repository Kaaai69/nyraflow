"""Сессии в JSON-файлах: переживают перезапуск, для демо этого достаточно."""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

from core import Session


class SessionStore:
    def __init__(self, data_dir: str | Path) -> None:
        self.sessions = Path(data_dir) / "sessions"
        self.transcripts = Path(data_dir) / "transcripts"
        self.sessions.mkdir(parents=True, exist_ok=True)
        self.transcripts.mkdir(parents=True, exist_ok=True)

    def _name(self, chat_id: str) -> str:
        return re.sub(r"[^\w-]", "_", chat_id)

    def load(self, chat_id: str) -> Session:
        path = self.sessions / f"{self._name(chat_id)}.json"
        if path.exists():
            return Session.from_dict(json.loads(path.read_text("utf-8")))
        return Session(chat_id=chat_id)

    def save(self, session: Session) -> None:
        path = self.sessions / f"{self._name(session.chat_id)}.json"
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(session.to_dict(), ensure_ascii=False, indent=1), "utf-8")
        os.replace(tmp, path)

    def log(self, chat_id: str, role: str, text: str) -> None:
        """Полная переписка — чтобы потом читать, где бот споткнулся, и править промпт."""
        line = json.dumps({"t": int(time.time()), "role": role, "text": text}, ensure_ascii=False)
        with open(self.transcripts / f"{self._name(chat_id)}.jsonl", "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
