"""MedSync — Agent 1: Anonymization Agent (ADK / A2A).

Detects and redacts PII from medical documents *before* they are shared.
The deterministic detection lives in tools so the behaviour is auditable and
demo-stable; Gemini (via ADK) drives the explanation + the human-in-the-loop
narrative on top.

Confidence policy (drives the HITL Redaction Review Gate):
  * > 0.90  -> auto-redact
  * 0.70-0.90 -> flagged_for_review  (a human must approve)
"""

import os
import re
import uuid

from google.adk.agents import LlmAgent

from . import memory

MODEL = os.environ.get("MEDSYNC_MODEL", "gemini-2.5-flash")
REVIEW_LOW, REVIEW_HIGH = 0.70, 0.90

# (regex, type, base confidence). Names/addresses are intentionally < 0.90 so
# they land in the human-review band — that is what powers the HITL demo.
_PII_PATTERNS = [
    (re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"), "AADHAAR", 0.99),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "EMAIL", 0.97),
    (re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b"), "PHONE_NUMBER", 0.95),
    (re.compile(r"\b(?:MRN|UHID|Reg(?:\.|istration)?\s*No\.?)[:\s]*([A-Z0-9-]{4,})\b", re.I), "MEDICAL_ID", 0.93),
    (re.compile(r"\bDr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?"), "DOCTOR_NAME", 0.81),
    (re.compile(r"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b"), "PERSON_NAME", 0.82),
    (re.compile(r"\b\d{1,3}[,/]?\s?[A-Z][a-z]+\s(?:Road|Street|Nagar|Layout|Colony|Marg)\b"), "ADDRESS", 0.74),
]


def detect_pii(text: str, redaction_level: str = "strict") -> dict:
    """Detect personally identifiable information in medical document text.

    Args:
        text: Raw extracted document text to scan.
        redaction_level: 'strict' redacts doctor/hospital names too; 'moderate'
            preserves them.

    Returns:
        A dict with the list of detected ``entities`` (each with type, value,
        start, end, confidence, and the suggested replacement token).
    """
    entities = []
    counters: dict[str, int] = {}
    taken: list[tuple[int, int]] = []

    for pattern, ptype, confidence in _PII_PATTERNS:
        if redaction_level == "moderate" and ptype in ("DOCTOR_NAME",):
            continue
        for m in pattern.finditer(text):
            span = (m.start(), m.end())
            # skip spans that overlap an already-claimed (higher priority) match
            if any(span[0] < e and span[1] > s for s, e in taken):
                continue
            taken.append(span)
            counters[ptype] = counters.get(ptype, 0) + 1
            entities.append(
                {
                    "id": f"e_{uuid.uuid4().hex[:6]}",
                    "type": ptype,
                    "value": m.group(0),
                    "start": m.start(),
                    "end": m.end(),
                    "confidence": confidence,
                    "redacted_as": f"[{ptype}_{counters[ptype]}]",
                }
            )

    entities.sort(key=lambda e: e["start"])
    return {"entities": entities, "pii_count": len(entities)}


def apply_redaction(text: str, redaction_level: str = "strict") -> dict:
    """Detect and redact PII, returning the anonymized document.

    Entities above 0.90 confidence are auto-redacted. Entities in the
    0.70-0.90 band are still masked in the preview but marked
    ``flagged_for_review`` — the Human-in-the-Loop gate requires a person to
    approve those before the document is shared/indexed.

    Args:
        text: Raw extracted document text.
        redaction_level: 'strict' or 'moderate'.

    Returns:
        anonymized_text, entities, mapping (reversible, for authorized access),
        flagged_for_review, pii_count, status, and a human-readable summary.
    """
    detection = detect_pii(text, redaction_level)
    entities = detection["entities"]

    redacted = text
    mapping: dict[str, str] = {}
    flagged = []
    # replace from the end so earlier offsets stay valid
    for ent in sorted(entities, key=lambda e: e["start"], reverse=True):
        redacted = redacted[: ent["start"]] + ent["redacted_as"] + redacted[ent["end"] :]
        mapping[ent["redacted_as"]] = ent["value"]
        if REVIEW_LOW <= ent["confidence"] < REVIEW_HIGH:
            flagged.append(ent)

    status = "NEEDS_REVIEW" if flagged else "APPROVED"
    avg_conf = round(sum(e["confidence"] for e in entities) / len(entities) * 100, 1) if entities else 100.0

    return {
        "anonymized_text": redacted,
        "entities": entities,
        "mapping": mapping,
        "flagged_for_review": flagged,
        "pii_count": len(entities),
        "average_confidence": avg_conf,
        "status": status,
        "summary": (
            f"Redacted {len(entities)} PII entities. "
            f"{len(flagged)} flagged for human review (70-90% confidence)."
        ),
    }


BASE_INSTRUCTION = (
    "You are MedSync's Anonymization Agent. When given medical document "
    "text, ALWAYS call the `apply_redaction` tool. Then report, clearly:\n"
    "1. How many PII entities were found and their types.\n"
    "2. The anonymized text.\n"
    "3. Which entities are FLAGGED FOR HUMAN REVIEW (confidence 70-90%) and "
    "why — these must be approved by a person before the document can be "
    "shared. If the status is NEEDS_REVIEW, make this prominent.\n"
    "Never reveal the reversible mapping unless explicitly asked by an "
    "authorized user. Be concise and factual — this is a medical compliance task."
)

# clinical conditions worth promoting into the patient profile when seen in a doc
_CONDITION_HINTS = {
    "diabetes": "Diabetes", "gestational": "Gestational diabetes",
    "hypertension": "Hypertension", "anaemia": "Anaemia", "anemia": "Anaemia",
    "asthma": "Asthma", "thyroid": "Thyroid disorder",
}


def _consolidate(ctx):
    """after_agent_callback: record that a document was anonymized and promote
    any clinical conditions found in the text into the patient profile."""
    pid = memory.patient_id_of(ctx)
    text = memory.user_text(ctx)
    found = sorted({label for key, label in _CONDITION_HINTS.items() if key in text.lower()})
    if found:
        memory.remember_profile(pid, {"conditions": found}, by="anonymizer")
    memory.remember_semantic(pid, "A medical document was anonymized and reviewed.", {"agent": "anonymizer"}, by="anonymizer")
    return None


root_agent = LlmAgent(
    name="anonymizer",
    model=MODEL,
    description=(
        "Detects and redacts personally identifiable information (PII) from "
        "medical documents before they are stored or shared, flagging "
        "low-confidence spans for human review."
    ),
    instruction=memory.instruction_with_memory(BASE_INSTRUCTION),
    before_agent_callback=memory.recall_callback,
    after_agent_callback=_consolidate,
    tools=[detect_pii, apply_redaction],
)
