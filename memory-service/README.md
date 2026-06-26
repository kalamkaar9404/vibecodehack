# MedSync Memory Service 🧠

The shared **memory layer** for all 3 agents — a small FastAPI service, keyed by
`patientId`, that agents call to **read context before acting** and **write facts
after**. Persists to a JSON volume now; swap `store.py` to Firestore later with no
API change.

## Tiers
| Tier | Endpoint | Backed by |
|---|---|---|
| Profile (conditions, meds, allergies) | `POST /memory/{pid}/profile` | JSON store (→ Firestore) |
| Preferences (diet, region, budget, **dislikes**) | `POST /memory/{pid}/preferences` | JSON store |
| Semantic (past Q&A / notes) | `POST /memory/{pid}/semantic` · `POST /memory/{pid}/search` | Gemini `text-embedding-004` + cosine (deterministic fallback) |
| Recall (assembled context block) | `GET /memory/{pid}/context?query=...` | all of the above |

Working/session memory lives in the ADK session, not here.

## Run
```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8090      # GOOGLE_API_KEY enables real embeddings
curl http://localhost:8090/health
```
Or via Docker with the agents: `cd agents && docker compose up --build` (service `memory`).

## How agents use it
`agents/*/src/memory.py` is the client + ADK callbacks:
- `before_agent_callback = recall_callback` → fetches `/context`, injects a
  `[PATIENT MEMORY]` block into the prompt via a dynamic `InstructionProvider`.
- `after_agent_callback = _consolidate` (per agent) → writes back:
  - **diet** persists disliked ingredients (the "no dalia" learns-once loop) + a note
  - **retriever** stores each clinical question as a semantic memory
  - **anonymizer** promotes detected conditions into the patient profile

Unreachable service → callbacks degrade to no-ops, so agents never break.
