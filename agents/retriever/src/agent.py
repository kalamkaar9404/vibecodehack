"""MedSync — Agent 2: Smart Retrieval Agent (ADK / A2A).

Answers a clinician's question about a patient by retrieving the most relevant
anonymized record chunks and returning them for cited synthesis. The retrieval
tool does a lightweight lexical relevance scan over the demo corpus (a stand-in
for Firestore + Vertex AI vector search); Gemini turns the hits into a concise,
*cited* summary.
"""

import os
import re

from google.adk.agents import LlmAgent

from . import memory
from .records import CHUNKS

MODEL = os.environ.get("MEDSYNC_MODEL", "gemini-2.5-flash")

# medical synonym expansion so "diabetes" also matches "HbA1c", "glucose", etc.
_SYNONYMS = {
    "diabetes": ["hba1c", "glucose", "metformin", "insulin", "diabetic", "gestational diabetes"],
    "bp": ["blood pressure", "mmhg", "hypertension"],
    "blood pressure": ["mmhg", "hypertension"],
    "allergy": ["allergic", "reaction", "penicillin", "rash"],
    "pregnancy": ["gestation", "obstetric", "delivery", "gestational"],
    "medication": ["prescription", "mg", "metformin", "supplement", "tablet"],
    "anaemia": ["haemoglobin", "hb", "iron"],
}


def _expand(query: str) -> list[str]:
    q = query.lower()
    terms = set(re.findall(r"[a-z0-9]+", q))
    for key, syns in _SYNONYMS.items():
        if key in q:
            terms.update(t for s in syns for t in s.split())
    return [t for t in terms if len(t) > 2]


def search_records(query: str, patient_id: str = "anon_7a3f", top_k: int = 3) -> dict:
    """Retrieve the most relevant anonymized record chunks for a clinical query.

    Args:
        query: The clinician's natural-language question.
        patient_id: Anonymized patient identifier to scope the search.
        top_k: Maximum number of chunks to return.

    Returns:
        A dict with ranked ``citations`` (doc_title, source, page, date, excerpt,
        relevance_score). Use these — and ONLY these — to answer, citing each
        claim back to its source.
    """
    terms = _expand(query)
    scored = []
    for c in CHUNKS:
        if c["patient_id"] != patient_id:
            continue
        text = c["text"].lower()
        score = sum(text.count(t) for t in terms)
        if score:
            scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)

    citations = [
        {
            "docId": c["id"],
            "docTitle": c["doc_title"],
            "source": c["source"],
            "pageNumber": c["page"],
            "date": c["date"],
            "excerpt": c["text"],
            "relevanceScore": round(score / max(1, len(terms)), 2),
        }
        for score, c in scored[:top_k]
    ]
    return {"query": query, "citations": citations, "count": len(citations)}


BASE_INSTRUCTION = (
    "You are MedSync's Smart Retrieval Agent for clinicians. For any "
    "question about a patient, ALWAYS call `search_records` first. Then "
    "write a concise (<150 word) summary that answers the question, and "
    "cite EVERY clinical claim inline using the source, e.g. "
    "'[Source: Lab Report, SRL Diagnostics, pg 1]'. Only use facts present "
    "in the returned citations — never invent clinical details. If the patient "
    "memory shows this was discussed before, acknowledge it briefly. If nothing "
    "relevant is found, say so. End with 1-2 suggested follow-up questions."
)


def _consolidate(ctx):
    """after_agent_callback: store the question as a semantic memory so future
    sessions can recall what was already asked."""
    pid = memory.patient_id_of(ctx)
    q = memory.user_text(ctx)
    if q:
        memory.remember_semantic(pid, f"Clinician asked: {q}", {"agent": "retriever"}, by="retriever")
    return None


root_agent = LlmAgent(
    name="retriever",
    model=MODEL,
    description=(
        "Answers clinical questions about a patient's history using RAG over "
        "anonymized records, returning a concise summary with source citations "
        "as verifiable proof."
    ),
    instruction=memory.instruction_with_memory(BASE_INSTRUCTION),
    before_agent_callback=memory.recall_callback,
    after_agent_callback=_consolidate,
    tools=[search_records],
)
