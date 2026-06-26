"""Infant-cry guidance knowledge base.

Maps a cry *category* (perceived by Gemini's multimodal audio understanding)
to deterministic, supportive guidance + a safety/escalation rule. Categories
follow the widely-used Donate-a-Cry corpus taxonomy, plus an explicit
distress/pain escalation path.

This is the deterministic half of the hybrid: Gemini classifies the audio, this
KB decides what to *say* and when to escalate — so medical guidance is never
left to model improvisation.
"""

DISCLAIMER = (
    "This is AI-assisted cry insight to support a caregiver's judgement — "
    "it is NOT a medical diagnosis. Trust your instincts and consult a "
    "pediatrician for any health concern."
)

CRY_CATEGORIES = {
    "hungry": {
        "label": "Hunger",
        "likely_cause": "Rhythmic, repetitive cry that builds — often with rooting or hand-to-mouth.",
        "soothing": ["Offer a feed", "Look for rooting / sucking cues", "Burp midway through feeding"],
        "escalate": False,
    },
    "tired": {
        "label": "Tiredness / sleepy",
        "likely_cause": "Whiny, continuous cry with yawning or eye-rubbing; fussiness before sleep.",
        "soothing": ["Reduce stimulation", "Swaddle and rock gently", "White noise / dim lights"],
        "escalate": False,
    },
    "discomfort": {
        "label": "Discomfort",
        "likely_cause": "Fussy, intermittent cry — wet/dirty diaper, too hot/cold, or uncomfortable position.",
        "soothing": ["Check and change diaper", "Adjust clothing/temperature", "Reposition / hold upright"],
        "escalate": False,
    },
    "burping": {
        "label": "Needs to burp / trapped wind",
        "likely_cause": "Squirmy cry shortly after feeding, pulling legs up briefly.",
        "soothing": ["Hold upright and pat the back", "Gentle tummy massage", "Bicycle the legs"],
        "escalate": False,
    },
    "belly_pain": {
        "label": "Belly pain / colic",
        "likely_cause": "Intense, high-pitched, inconsolable cry; clenched fists, legs drawn up; often evening.",
        "soothing": ["Tummy massage and warm compress", "Bicycle legs / anti-colic hold", "Calm, quiet environment"],
        "escalate": True,
    },
    "pain_or_distress": {
        "label": "Pain / acute distress",
        "likely_cause": "Sudden, sharp, very high-pitched scream — possible pain or unwell.",
        "soothing": ["Check for injury / tight clothing / fever", "Comfort and monitor closely"],
        "escalate": True,
    },
}

LOW_CONFIDENCE = 0.5


def lookup(category: str, confidence: float) -> dict:
    """Return guidance for a category; flag escalation on pain or low confidence."""
    key = (category or "").strip().lower().replace(" ", "_")
    entry = CRY_CATEGORIES.get(key)
    unknown = entry is None
    if unknown:
        entry = {
            "label": "Uncertain",
            "likely_cause": "The cry could not be confidently categorized.",
            "soothing": ["Try feeding, changing, and soothing in turn", "Monitor for other symptoms"],
            "escalate": False,
        }
    escalate = bool(entry["escalate"]) or unknown or (confidence is not None and confidence < LOW_CONFIDENCE)
    safety_note = (
        "⚠️ If the crying is inconsolable, or there is fever, poor feeding, "
        "breathing difficulty, or it feels like pain — contact a pediatrician now."
        if escalate else
        "If symptoms persist or you are worried, check with your pediatrician."
    )
    return {
        "category": key,
        "label": entry["label"],
        "confidence": confidence,
        "likely_cause": entry["likely_cause"],
        "soothing_tips": entry["soothing"],
        "escalate": escalate,
        "safety_note": safety_note,
        "disclaimer": DISCLAIMER,
    }
