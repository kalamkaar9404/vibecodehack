"""MedSync — Agent 4: Infant Cry Insight Agent (ADK / A2A).

Hybrid design: Gemini's multimodal audio understanding *perceives* the cry and
picks a category; the deterministic `cry_guidance` tool decides what to say,
when to escalate, and logs the event to the patient memory. This keeps medical
guidance auditable rather than improvised, and demonstrates Gemini multimodal +
the memory layer working together.

NOTE: framed as supportive *insight*, not diagnosis (see DISCLAIMER).
"""

import os

from google.adk.agents import LlmAgent

from . import memory
from .cry_kb import lookup, CRY_CATEGORIES

MODEL = os.environ.get("MEDSYNC_MODEL", "gemini-2.5-flash")
_CATS = ", ".join(CRY_CATEGORIES.keys())


def cry_guidance(category: str, confidence: float = 0.7) -> dict:
    """Return caregiver guidance for a perceived infant-cry category, and log it.

    Call this AFTER listening to the cry audio and deciding the most likely
    category.

    Args:
        category: One of: hungry, tired, discomfort, burping, belly_pain,
            pain_or_distress.
        confidence: Your confidence 0.0-1.0 in the category.

    Returns:
        label, likely_cause, soothing_tips, escalate (bool), safety_note,
        disclaimer. Escalation is forced for pain/belly_pain or low confidence.
    """
    result = lookup(category, confidence)
    # Persist the structured signal to the patient/infant memory (best-effort).
    pid = memory.DEFAULT_PATIENT
    memory.remember_profile(pid, {"last_cry_category": result["category"]}, by="cry_analyzer")
    memory.remember_semantic(
        pid,
        f"Infant cry analyzed as '{result['label']}' (confidence {confidence}).",
        {"agent": "cry_analyzer", "escalate": result["escalate"]},
        by="cry_analyzer",
    )
    return result


BASE_INSTRUCTION = (
    "You are MedSync's Infant Cry Insight Agent. You receive an audio recording "
    "of an infant crying (and optionally text context from the caregiver). "
    "Listen to the audio and decide the single most likely category from: "
    f"{_CATS}. Then ALWAYS call `cry_guidance` with that category and your "
    "confidence (0-1). Present, warmly and briefly:\n"
    "1. The likely reason + your confidence.\n"
    "2. 2-3 soothing suggestions.\n"
    "3. If `escalate` is true, make the safety note PROMINENT (recommend "
    "contacting a pediatrician).\n"
    "4. Briefly mention the dataset grounding from the `reference` field "
    "(the Donate-a-Cry corpus the categories come from).\n"
    "ALWAYS end with the disclaimer that this is supportive insight, not a "
    "medical diagnosis. If no audio was provided, ask the caregiver to record "
    "10-15 seconds of the cry."
)


root_agent = LlmAgent(
    name="cry_analyzer",
    model=MODEL,
    description=(
        "Analyzes a recorded infant cry from audio and gives the caregiver "
        "supportive insight into the likely reason (hunger, tiredness, "
        "discomfort, burping, belly pain, or distress) with soothing tips and a "
        "safety escalation when needed. Supportive insight, not a diagnosis."
    ),
    instruction=memory.instruction_with_memory(BASE_INSTRUCTION),
    before_agent_callback=memory.recall_callback,
    tools=[cry_guidance],
)
