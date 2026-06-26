"""MedSync — Agent 5: Post-Treatment Follow-up Agent (ADK / A2A).

A check-in chatbot that proactively asks how the patient is doing after starting
a treatment, so medication side effects are caught EARLY. Gemini drives the warm,
natural conversation; deterministic tools make the severity/escalation decision
and log every report to the memory layer (building a side-effect timeline).
"""

import os

from google.adk.agents import LlmAgent

from . import memory
from .side_effects_kb import assess

MODEL = os.environ.get("MEDSYNC_MODEL", "gemini-2.5-flash")


def get_active_medications() -> dict:
    """Return the patient's current medications from memory (for the check-in)."""
    pid = memory.DEFAULT_PATIENT
    rec = memory.recall(pid) or {}
    profile = (rec.get("profile") or {})
    meds = profile.get("currentMeds") or profile.get("current_meds") or []
    # currentMeds may be list of dicts or strings
    names = []
    for m in meds:
        names.append(m.get("name") if isinstance(m, dict) else str(m))
    return {"medications": [n for n in names if n], "count": len(names)}


def check_side_effect(medication: str, symptom: str) -> dict:
    """Assess a reported symptom for a medication: severity + whether to escalate.

    Args:
        medication: The medication the patient is taking (e.g. "Metformin").
        symptom: The symptom they reported, in plain words (e.g. "muscle pain").

    Returns:
        severity (common | serious | unknown_*), escalate (bool), guidance, note.
        ALWAYS surface the guidance; if escalate is true, urge urgent care.
    """
    return assess(medication, symptom)


def log_side_effect(medication: str, symptom: str, severity: str) -> dict:
    """Record a reported side effect to the patient's memory (side-effect timeline).

    Args:
        medication: The medication involved.
        symptom: The reported symptom.
        severity: 'common' or 'serious' (from check_side_effect).
    """
    pid = memory.DEFAULT_PATIENT
    serious = severity == "serious"
    memory.remember_semantic(
        pid,
        f"Follow-up: reported '{symptom}' on {medication} (severity: {severity}).",
        {"agent": "followup", "medication": medication, "severity": severity, "escalate": serious},
        by="followup",
    )
    return {"logged": True, "escalated": serious}


BASE_INSTRUCTION = (
    "You are MedSync's Post-Treatment Follow-up companion. Your job is a warm, "
    "brief check-in to catch medication side effects EARLY. Steps:\n"
    "1. Call `get_active_medications` and greet the patient, referencing their "
    "current medication(s). If none are on file, ask what they're taking.\n"
    "2. Ask how they've been feeling since starting it — any new symptoms?\n"
    "3. For EACH symptom they mention, call `check_side_effect(medication, symptom)`, "
    "then `log_side_effect(...)` with the returned severity.\n"
    "4. If any result has escalate=true, make it PROMINENT and clear: advise "
    "contacting their doctor or urgent care NOW, and why.\n"
    "5. For common/mild ones, reassure and say what to watch for.\n"
    "Be calm, kind, and concise. End with a short summary and remind them this "
    "is supportive monitoring, not a diagnosis. Use patient memory to avoid "
    "re-asking what's already known and to notice repeat reports."
)


def _consolidate(ctx):
    """after_agent_callback: note that a follow-up check-in happened."""
    pid = memory.patient_id_of(ctx)
    memory.remember_semantic(pid, "Post-treatment follow-up check-in completed.",
                             {"agent": "followup"}, by="followup")
    return None


root_agent = LlmAgent(
    name="followup",
    model=MODEL,
    description=(
        "Post-treatment follow-up companion that checks in on the patient, "
        "tracks medication side effects over time, and escalates serious "
        "reactions early. Supportive monitoring, not a diagnosis."
    ),
    instruction=memory.instruction_with_memory(BASE_INSTRUCTION),
    before_agent_callback=memory.recall_callback,
    after_agent_callback=_consolidate,
    tools=[get_active_medications, check_side_effect, log_side_effect],
)
