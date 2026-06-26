"""MedSync — Agent 3: Dietary Substitution Agent (ADK / A2A).

Suggests nutritionally-equivalent, locally-available, affordable Indian
substitutes for prescribed ingredients while respecting dietary preferences and
medical safety (pregnancy, diabetes). The KB lookup + safety checks are
deterministic tools; Gemini parses the free-text diet plan and composes the
final plan + modified recipe.
"""

import os
import re

from google.adk.agents import LlmAgent

from .nutrition_kb import SUBSTITUTIONS, SAFETY_RULES

MODEL = os.environ.get("MEDSYNC_MODEL", "gemini-2.5-flash")


def find_substitutes(ingredients: list[str], preferences: list[str] = None,
                     conditions: list[str] = None) -> dict:
    """Find Indian substitutes for ingredients, respecting preferences & medical safety.

    Args:
        ingredients: Ingredient names to substitute (e.g. ["quinoa", "avocado"]).
        preferences: Dietary constraints, e.g. ["vegetarian", "vegan", "jain"].
        conditions: Medical conditions to safety-check, e.g. ["pregnancy", "diabetes"].

    Returns:
        substitutions (with nutrition comparison, cost, availability, warnings),
        plus any unknown ingredients and applied medical-safety notes.
    """
    preferences = [p.lower() for p in (preferences or [])]
    conditions = [c.lower() for c in (conditions or [])]
    results, unknown, safety_notes = [], [], []

    for raw in ingredients:
        key = raw.strip().lower()
        entry = SUBSTITUTIONS.get(key)
        if not entry:
            unknown.append(raw)
            continue

        # preference check: substitute must satisfy all stated preferences
        if preferences and not all(p in entry["tags"] for p in preferences):
            safety_notes.append(
                f"{entry['substitute']} may not fit all preferences ({', '.join(preferences)}); verify."
            )

        sub = {
            "original": raw.title(),
            "substitute": entry["substitute"],
            "emoji": entry["emoji"],
            "nutrients": entry["nutrients"],
            "cost_original": entry["cost_original"],
            "cost_substitute": entry["cost_substitute"],
            "savings": entry["savings"],
            "availability": entry["availability"],
            "warning": entry.get("warning"),
            "medical_safe": True,
        }
        if "diabetes" in conditions and entry.get("high_gi"):
            sub["medical_safe"] = False
            sub["warning"] = (sub["warning"] + " | " if sub["warning"] else "") + \
                "High glycemic index — not ideal for diabetes."
        results.append(sub)

    for cond in conditions:
        rule = SAFETY_RULES.get(cond)
        if rule and rule.get("unsafe"):
            safety_notes.append(
                f"For {cond}: avoid {', '.join(rule['unsafe'])}."
            )

    return {
        "substitutions": results,
        "unknown_ingredients": unknown,
        "safety_notes": safety_notes,
        "count": len(results),
    }


root_agent = LlmAgent(
    name="diet",
    model=MODEL,
    description=(
        "Suggests nutritionally-equivalent, affordable, locally-available "
        "Indian substitutes for prescribed meal-plan ingredients, respecting "
        "dietary preferences and medical safety."
    ),
    instruction=(
        "You are MedSync's Dietary Substitution Agent. Given a diet plan or a "
        "list of ingredients (often with constraints like 'can't find X', "
        "'too expensive', 'vegetarian', or a condition like 'pregnant'), first "
        "extract the ingredient names, preferences, and conditions, then call "
        "`find_substitutes`. Present each swap clearly: original -> substitute, "
        "the nutrition comparison, the cost saving, availability, and any "
        "warnings. If conditions include pregnancy or diabetes, surface the "
        "safety notes prominently. Finish with a short modified recipe. Be warm "
        "and practical — the goal is a plan the patient can actually follow."
    ),
    tools=[find_substitutes],
)
