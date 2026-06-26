"""Memory-layer client + ADK callbacks (shared across MedSync agents).

Agents READ context before acting (before_agent_callback -> inject recalled
memory into the prompt) and WRITE facts after (after_agent_callback). Talks to
the standalone memory-service over HTTP, keyed by patientId. Degrades gracefully
to a no-op if the service is unreachable, so agents never break.
"""

from __future__ import annotations

import json
import os
import re
import urllib.request

MEMORY_URL = os.environ.get("MEMORY_URL", "http://localhost:8090").rstrip("/")
DEFAULT_PATIENT = os.environ.get("MEDSYNC_PATIENT_ID", "anon_7a3f")
RECALL_STATE_KEY = "recalled_memory"


# --------------------------------------------------------------------------- #
#  HTTP client (stdlib only; no extra deps in the agent image)
# --------------------------------------------------------------------------- #
def _req(method: str, path: str, body: dict | None = None, timeout: float = 8.0):
    url = f"{MEMORY_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception:
        return None  # graceful degradation


def recall(patient_id: str, query: str = "", top_k: int = 3) -> dict | None:
    q = urllib.request.quote(query or "")
    return _req("GET", f"/memory/{patient_id}/context?query={q}&top_k={top_k}")


def remember_profile(patient_id: str, facts: dict, by: str) -> None:
    _req("POST", f"/memory/{patient_id}/profile", {"facts": facts, "updated_by": by})


def remember_preferences(patient_id: str, prefs: dict | None = None,
                         dislikes: list[str] | None = None, by: str = "system") -> None:
    _req("POST", f"/memory/{patient_id}/preferences",
         {"prefs": prefs or {}, "dislikes": dislikes or [], "updated_by": by})


def remember_semantic(patient_id: str, text: str, metadata: dict, by: str) -> None:
    _req("POST", f"/memory/{patient_id}/semantic",
         {"text": text, "metadata": metadata, "updated_by": by})


# --------------------------------------------------------------------------- #
#  Context helpers
# --------------------------------------------------------------------------- #
def patient_id_of(ctx) -> str:
    """Resolve the patient id from session state / user id, else the default."""
    try:
        pid = (ctx.state or {}).get("patient_id")
        if pid:
            return pid
    except Exception:
        pass
    uid = getattr(ctx, "user_id", None)
    return uid if uid and uid != "user" else DEFAULT_PATIENT


def user_text(ctx) -> str:
    """Extract the user's message text from the callback context."""
    content = getattr(ctx, "user_content", None)
    if not content:
        return ""
    parts = getattr(content, "parts", None) or []
    return " ".join(getattr(p, "text", "") or "" for p in parts).strip()


# --------------------------------------------------------------------------- #
#  ADK callbacks
# --------------------------------------------------------------------------- #
def recall_callback(ctx):
    """before_agent_callback: load memory and stash it in session state so the
    instruction provider can inject it. Returns None (do not skip the agent)."""
    pid = patient_id_of(ctx)
    data = recall(pid, query=user_text(ctx))
    block = (data or {}).get("context_block", "") if data else ""
    try:
        ctx.state[RECALL_STATE_KEY] = block
    except Exception:
        pass
    return None


def instruction_with_memory(base_instruction: str):
    """Return an ADK InstructionProvider that prepends recalled memory (if any)."""

    def provider(readonly_ctx) -> str:
        block = ""
        try:
            block = (readonly_ctx.state or {}).get(RECALL_STATE_KEY, "")
        except Exception:
            block = ""
        if block:
            return (
                f"{block}\n\nUse the patient memory above to personalize your "
                f"response and avoid re-asking what is already known.\n\n{base_instruction}"
            )
        return base_instruction

    return provider


# --------------------------------------------------------------------------- #
#  Deterministic signal extraction (for write-back)
# --------------------------------------------------------------------------- #
_DISLIKE_RE = re.compile(
    r"(?:don'?t|do not|can'?t stand|dislike|hate|won'?t eat|no more)\s+(?:like\s+)?([a-z][a-z \-]{2,30})",
    re.I,
)


def extract_dislikes(text: str) -> list[str]:
    found = []
    for m in _DISLIKE_RE.finditer(text or ""):
        token = m.group(1).strip().rstrip(".,;!").split(" either")[0].strip()
        # keep it to 1-2 words (ingredient-like)
        token = " ".join(token.split()[:2])
        if token:
            found.append(token)
    return found
