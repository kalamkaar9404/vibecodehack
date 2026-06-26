"""MedSync Memory Service — shared memory substrate for all 3 agents.

A small FastAPI service the agents call to read context before acting and write
facts after. Keyed by patientId. Persists to a JSON volume now; swap `store.py`
to Firestore later with no API change.

Run: uvicorn app:app --host 0.0.0.0 --port 8090
"""

from fastapi import FastAPI
from pydantic import BaseModel

import store

app = FastAPI(title="MedSync Memory Service", version="1.0.0")


class ProfileIn(BaseModel):
    facts: dict
    updated_by: str = "system"


class PreferencesIn(BaseModel):
    prefs: dict = {}
    dislikes: list[str] = []
    updated_by: str = "system"


class SemanticIn(BaseModel):
    text: str
    metadata: dict = {}
    updated_by: str = "system"


class SearchIn(BaseModel):
    query: str
    top_k: int = 3


@app.get("/health")
def health():
    return {"status": "ok", "service": "memory"}


@app.get("/memory/{patient_id}")
def get_memory(patient_id: str):
    return store.get_record(patient_id)


@app.get("/memory/{patient_id}/context")
def get_context(patient_id: str, query: str = "", top_k: int = 3):
    """Recall: assembled profile + preferences + relevant memories (+ inject block)."""
    return store.assemble_context(patient_id, query, top_k)


@app.post("/memory/{patient_id}/profile")
def post_profile(patient_id: str, body: ProfileIn):
    return {"profile": store.update_profile(patient_id, body.facts, body.updated_by)}


@app.post("/memory/{patient_id}/preferences")
def post_preferences(patient_id: str, body: PreferencesIn):
    return {"preferences": store.update_preferences(patient_id, body.prefs, body.dislikes, body.updated_by)}


@app.post("/memory/{patient_id}/semantic")
def post_semantic(patient_id: str, body: SemanticIn):
    return store.add_semantic(patient_id, body.text, body.metadata, body.updated_by)


@app.post("/memory/{patient_id}/search")
def post_search(patient_id: str, body: SearchIn):
    return {"results": store.search_semantic(patient_id, body.query, body.top_k)}
