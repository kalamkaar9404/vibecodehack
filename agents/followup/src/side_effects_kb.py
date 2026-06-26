"""Medication side-effect knowledge base for post-treatment follow-up.

Maps common medications to their *expected* (common) side effects and their
*red-flag* (serious) ones. The agent uses Gemini to chat naturally and pull the
symptom out of free text; this KB makes the **severity + escalation decision**
deterministic — so "call your doctor now" is never left to model guesswork.

Focused on our personas (diabetes + pregnancy) plus a few high-risk meds.
"""

# medication -> {common: [...], serious: [...], note: str}
MEDICATIONS = {
    "metformin": {
        "common": ["nausea", "diarrhea", "stomach upset", "metallic taste", "loss of appetite"],
        "serious": ["muscle pain", "trouble breathing", "severe drowsiness", "unusual weakness",
                    "very cold feeling", "slow heartbeat"],  # lactic acidosis red flags
        "note": "Persistent vomiting or signs of lactic acidosis (muscle pain, weakness, trouble breathing) need urgent care.",
    },
    "insulin": {
        "common": ["sweating", "shakiness", "mild dizziness", "hunger", "injection site soreness"],
        "serious": ["confusion", "seizure", "fainting", "loss of consciousness", "unable to wake"],
        "note": "Signs of severe low blood sugar (confusion, fainting, seizure) are an emergency.",
    },
    "iron": {
        "common": ["constipation", "dark stools", "nausea", "stomach cramps"],
        "serious": ["vomiting blood", "severe abdominal pain", "black tarry stools with pain"],
        "note": "Dark stools are usually normal on iron; bleeding or severe pain is not.",
    },
    "folic acid": {"common": ["mild nausea"], "serious": [], "note": ""},
    "calcium": {"common": ["constipation", "bloating", "gas"], "serious": ["severe constipation", "kidney stone pain"], "note": ""},
    "warfarin": {
        "common": ["minor bruising"],
        "serious": ["unusual bleeding", "blood in urine", "black stools", "coughing blood", "bleeding that won't stop"],
        "note": "Warfarin + unusual bleeding is a red flag — seek care.",
    },
    "amoxicillin": {
        "common": ["mild rash", "diarrhea", "nausea"],
        "serious": ["facial swelling", "trouble breathing", "hives all over", "throat tightness"],
        "note": "Swelling or breathing trouble may be a serious allergic reaction — emergency.",
    },
}

# symptoms that are an emergency regardless of which medication
GENERIC_RED_FLAGS = [
    "chest pain", "trouble breathing", "difficulty breathing", "severe swelling",
    "fainting", "seizure", "loss of consciousness", "bleeding that won't stop",
    "blue lips", "severe allergic reaction", "anaphylaxis",
]


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def assess(medication: str, symptom: str) -> dict:
    """Classify a reported symptom for a medication: severity + escalation."""
    med = _norm(medication)
    sym = _norm(symptom)
    entry = MEDICATIONS.get(med)

    def _hit(bucket):
        return any(k in sym or sym in k for k in bucket)

    # 1) universal emergencies
    if _hit(GENERIC_RED_FLAGS):
        severity, known = "serious", True
    elif entry and _hit(entry["serious"]):
        severity, known = "serious", True
    elif entry and _hit(entry["common"]):
        severity, known = "common", True
    elif entry is None:
        severity, known = "unknown_medication", False
    else:
        severity, known = "unrecognized_symptom", False

    escalate = severity in ("serious",)
    if severity == "common":
        guidance = "This is a known, usually mild side effect. Keep monitoring; mention it at your next visit if it persists."
    elif severity == "serious":
        guidance = "⚠️ This can be a serious reaction. Contact your doctor or seek urgent care NOW."
    elif severity == "unknown_medication":
        guidance = "I don't have this medication on file. If the symptom is bothering you, check with your doctor."
    else:
        guidance = "I can't match this to a known side effect. If it's worsening or worrying you, contact your doctor."

    note = entry["note"] if entry else ""
    return {
        "medication": med or medication,
        "symptom": symptom,
        "severity": severity,
        "is_known": known,
        "escalate": escalate,
        "guidance": guidance,
        "note": note,
    }
