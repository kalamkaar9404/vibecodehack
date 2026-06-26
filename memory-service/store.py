"""MedSync Memory Store — the 4-tier memory substrate.

Backend-agnostic by design: persistence is a single JSON document today (a
volume in Docker), swappable to Firestore later without changing the API.

Tiers:
  * profile      - long-term structured patient facts (conditions, meds, allergies)
  * preferences  - learned likes/dislikes & constraints (diet, region, budget, dislikes)
  * semantic     - embedded text memories (past Q&A, notes) for cross-session recall
  * (working/session memory lives in the ADK session, not here)

Embeddings use Gemini `text-embedding-004` when GOOGLE_API_KEY/GEMINI_API_KEY is
set; otherwise a deterministic local fallback keeps semantic search functional.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import threading
import time
import urllib.request
from pathlib import Path

DATA_PATH = Path(os.environ.get("MEMORY_DATA_PATH", "./memory_data/memory.json"))
_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
_EMBED_MODEL = os.environ.get("MEMORY_EMBED_MODEL", "text-embedding-004")
_FALLBACK_DIM = 256

_lock = threading.Lock()


# --------------------------------------------------------------------------- #
#  Embeddings
# --------------------------------------------------------------------------- #
def _gemini_embed(text: str) -> list[float] | None:
    """Real embedding via the Gemini API. Returns None if unavailable."""
    if not _API_KEY:
        return None
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{_EMBED_MODEL}:embedContent?key={_API_KEY}"
    )
    body = json.dumps(
        {"model": f"models/{_EMBED_MODEL}", "content": {"parts": [{"text": text}]}}
    ).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        return data.get("embedding", {}).get("values")
    except Exception:
        return None


def _fallback_embed(text: str) -> list[float]:
    """Deterministic hashing bag-of-words embedding (no network/creds)."""
    vec = [0.0] * _FALLBACK_DIM
    for tok in _tokens(text):
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % _FALLBACK_DIM] += 1.0
    return vec


def embed(text: str) -> tuple[list[float], str]:
    """Return (embedding, source) where source is 'gemini' or 'fallback'."""
    v = _gemini_embed(text)
    if v:
        return v, "gemini"
    return _fallback_embed(text), "fallback"


def _tokens(text: str) -> list[str]:
    return [t for t in "".join(c.lower() if c.isalnum() else " " for c in text).split() if len(t) > 2]


def cosine(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    if n == 0:
        return 0.0
    dot = sum(a[i] * b[i] for i in range(n))
    na = math.sqrt(sum(x * x for x in a[:n]))
    nb = math.sqrt(sum(x * x for x in b[:n]))
    return dot / (na * nb) if na and nb else 0.0


# --------------------------------------------------------------------------- #
#  Persistence
# --------------------------------------------------------------------------- #
def _load() -> dict:
    if DATA_PATH.exists():
        try:
            return json.loads(DATA_PATH.read_text())
        except Exception:
            return {"patients": {}}
    return {"patients": {}}


def _save(db: dict) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(db, indent=2))


def _patient(db: dict, pid: str) -> dict:
    return db["patients"].setdefault(
        pid, {"profile": {}, "preferences": {"dislikes": []}, "semantic": [], "updated_at": None}
    )


# --------------------------------------------------------------------------- #
#  Public API (used by the FastAPI app)
# --------------------------------------------------------------------------- #
def get_record(pid: str) -> dict:
    with _lock:
        db = _load()
        p = _patient(db, pid)
        # never return raw embeddings to callers
        return {
            "patientId": pid,
            "profile": p["profile"],
            "preferences": p["preferences"],
            "semantic_count": len(p["semantic"]),
            "updated_at": p["updated_at"],
        }


def update_profile(pid: str, facts: dict, updated_by: str = "system") -> dict:
    with _lock:
        db = _load()
        p = _patient(db, pid)
        for k, v in (facts or {}).items():
            if isinstance(v, list):
                existing = p["profile"].get(k, [])
                p["profile"][k] = sorted(set(existing) | set(v))
            else:
                p["profile"][k] = v
        p["updated_at"] = _now()
        p["updated_by"] = updated_by
        _save(db)
        return p["profile"]


def update_preferences(pid: str, prefs: dict | None = None, dislikes: list[str] | None = None,
                       updated_by: str = "system") -> dict:
    with _lock:
        db = _load()
        p = _patient(db, pid)
        for k, v in (prefs or {}).items():
            p["preferences"][k] = v
        if dislikes:
            cur = set(p["preferences"].get("dislikes", []))
            cur |= {d.strip().lower() for d in dislikes if d.strip()}
            p["preferences"]["dislikes"] = sorted(cur)
        p["updated_at"] = _now()
        p["updated_by"] = updated_by
        _save(db)
        return p["preferences"]


def add_semantic(pid: str, text: str, metadata: dict | None = None,
                 updated_by: str = "system") -> dict:
    vector, source = embed(text)
    with _lock:
        db = _load()
        p = _patient(db, pid)
        entry = {
            "id": f"m_{len(p['semantic']) + 1}",
            "text": text,
            "metadata": metadata or {},
            "embedding": vector,
            "embed_source": source,
            "created_at": _now(),
        }
        p["semantic"].append(entry)
        p["updated_at"] = _now()
        p["updated_by"] = updated_by
        _save(db)
        return {"id": entry["id"], "embed_source": source, "total": len(p["semantic"])}


def search_semantic(pid: str, query: str, top_k: int = 3) -> list[dict]:
    qvec, _ = embed(query)
    with _lock:
        db = _load()
        p = _patient(db, pid)
        scored = [
            {
                "id": e["id"],
                "text": e["text"],
                "metadata": e["metadata"],
                "score": round(cosine(qvec, e["embedding"]), 4),
            }
            for e in p["semantic"]
        ]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


def assemble_context(pid: str, query: str = "", top_k: int = 3) -> dict:
    """Convenience 'recall' endpoint: profile + preferences + relevant memories,
    plus a ready-to-inject text block agents can prepend to their prompt."""
    rec = get_record(pid)
    memories = search_semantic(pid, query, top_k) if query else []
    lines = ["[PATIENT MEMORY]"]
    if rec["profile"]:
        lines.append("Profile: " + _fmt(rec["profile"]))
    if rec["preferences"] and any(rec["preferences"].values()):
        lines.append("Preferences: " + _fmt(rec["preferences"]))
    if memories:
        lines.append("Relevant past notes:")
        lines += [f"  - {m['text']}" for m in memories if m["score"] > 0]
    block = "\n".join(lines) if len(lines) > 1 else ""
    return {
        "patientId": pid,
        "profile": rec["profile"],
        "preferences": rec["preferences"],
        "memories": memories,
        "context_block": block,
    }


def _fmt(d: dict) -> str:
    parts = []
    for k, v in d.items():
        if not v:
            continue
        parts.append(f"{k}={', '.join(map(str, v)) if isinstance(v, list) else v}")
    return "; ".join(parts)


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
