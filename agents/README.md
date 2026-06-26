# MedSync Agents (ADK · A2A)

Three specialized agents, each an [ADK](https://adk.dev) `LlmAgent` exposed over
the **A2A protocol** so the Nasiko control plane can register and route to them.
Real domain logic lives in deterministic **tools** (so behaviour is auditable and
demo-stable); Gemini drives orchestration and natural language on top.

| Agent | Port (local) | Tool(s) | What it does |
|---|---|---|---|
| `anonymizer` | 5001 | `detect_pii`, `apply_redaction` | Redacts PII; flags 70–90%-confidence spans for the **HITL review gate** |
| `retriever` | 5002 | `search_records` | RAG over anonymized records → **cited** clinical summary |
| `diet` | 5003 | `find_substitutes` | Indian ingredient substitutions with nutrition + safety checks |

## Run locally (no Docker)

```bash
pip install -r anonymizer/requirements.txt        # once
export GOOGLE_API_KEY=...                           # from https://aistudio.google.com/apikey
export GOOGLE_GENAI_USE_VERTEXAI=FALSE
cd anonymizer && python -m src                      # serves A2A on :5000
```

> Tools run without a key, but the LLM layer needs `GOOGLE_API_KEY` (or `GEMINI_API_KEY`).

## Run all 3 with Docker

```bash
GOOGLE_API_KEY=... docker compose up --build
# agent cards:
curl http://localhost:5001/.well-known/agent-card.json   # anonymizer
curl http://localhost:5002/.well-known/agent-card.json   # retriever
curl http://localhost:5003/.well-known/agent-card.json   # diet
```

## Deploy into Nasiko

Each agent ships the `Agentcard.json` + `Dockerfile` + `src/__main__.py` layout
Nasiko expects. Register via the Redis orchestration stream:

```bash
docker exec redis redis-cli XADD orchestration:commands '*' \
  command deploy_agent agent_name retriever \
  agent_path /app/agents/retriever base_url http://nasiko-backend:8000 \
  upload_type directory
```

Nasiko builds the image, injects Phoenix tracing, and registers the agent with
Kong + the backend. The UI then calls Nasiko's `/router`, which uses the
`Agentcard.json` `description` + `examples` to pick the right agent.
