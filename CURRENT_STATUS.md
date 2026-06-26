# 📊 MedSync AI — Current Status

> **Track B: Enterprise Agent Engineering** · Agent Arena Bangalore 2026
> Last updated: **2026-06-26**
> Workflow target: `Gemini CLI + ADK → Nasiko → Cloud Run`

**Overall progress: ~30–35%.** The hardest, most differentiating piece — real
agent engineering with **ADK + A2A** — is built and verified. Deployment,
Vertex AI depth, and the live Nasiko orchestration are the main gaps.

---

## 🧰 Track B Toolchain

| Tool | Status | Reality |
|---|---|---|
| **ADK** (Agent Development Kit) | ✅ Using | `google-adk` 2.3.0 — all 3 agents are real `LlmAgent`s with tools, exposed over **A2A**. Verified: agent card served (HTTP 200). |
| **Gemini** (model) | 🟡 Wired, not live | Agents call `gemini-2.5-flash` via ADK. Needs `GOOGLE_API_KEY` in `.env` to invoke the LLM (deterministic tools work without it). |
| **Nasiko** (control plane) | 🟡 In progress | Cloned to `nasiko-platform/` (gitignored), `.nasiko-local.env` generated. 13-service stack **not yet running** (needs Docker Desktop daemon); agents **not yet registered**. |
| **Gemini CLI** | ❌ Not using | Not installed. Agents authored directly against ADK. Optional at runtime; add to satisfy the literal workflow narrative. |
| **Cloud Run** | ❌ Not started | No deployment yet. **Mandatory (10% of score).** |

## ☁️ Other Google Services (20% "depth" criterion)

| Service | Status | Notes |
|---|---|---|
| Gemini 2.5 | 🟡 wired via ADK | needs API key |
| **Vertex AI** (`text-embedding-004` / Vector Search) | ❌ not using | Agent 2 uses synthetic corpus + lexical search, **not embeddings** — a gap for the Vertex depth score |
| Document AI (OCR) | ❌ not yet | |
| Firestore | ❌ not yet | records/memory are in-memory |
| Cloud Storage | ❌ not yet | |
| Firebase Auth | ❌ not yet | auth page is a mock timeout |
| Cloud Logging | ❌ not yet | Phoenix tracing arrives with Nasiko once up |

---

## ✅ What's Done

### Backend / Agents (`agents/`)
Three ADK `LlmAgent`s exposed over A2A in Nasiko's expected layout
(`Agentcard.json` + `Dockerfile` + `src/__main__.py`, serving on `:5000`).
Real domain logic lives in deterministic **tools**; Gemini orchestrates + writes
the natural language.

| Agent | Tools | Verified |
|---|---|---|
| `anonymizer` | `detect_pii`, `apply_redaction` | 5 PII found, status `NEEDS_REVIEW` (name/doctor flagged 0.81–0.82 → drives HITL) |
| `retriever` | `search_records` | "diabetes history" → Discharge Summary + Lab Report + Prescription, with citations |
| `diet` | `find_substitutes` | quinoa/avocado/chia → dalia/banana+flaxseed/sabja + pregnancy safety note |

Also: combined + per-agent `docker-compose.yml`, `requirements.txt`,
`.env.example`, `agents/README.md`. Anonymizer's A2A server confirmed serving
its agent card at HTTP 200.

### Frontend (`app/`)
- Design system (`globals.css`) — complete
- Landing page — complete
- Auth page — complete (mock login, no real Firebase)
- Dashboard shell — sidebar + navbar layout (`app/dashboard/layout.js`)
- Diet Planner page (`/dashboard/diet`) — complete UI (hardcoded data, not yet wired to agent)
- Anonymize demo API route (`/api/anonymize`) — Gemini call + regex fallback

### Docs
- `docs/implementation_plan.md` (v3) — orchestrator + memory layer + HITL stage
- This status file

---

## 📈 Completion vs. Implementation Plan

| Component | % | Notes |
|---|---|---|
| Design system + landing + auth UI | ~90% | auth is mock |
| Dashboard shell (sidebar/navbar) | 100% | |
| Agent 1 Anonymizer | ~70% | ADK + PII tools + HITL flagging; no Document AI / Firestore |
| Agent 2 Retriever | ~55% | ADK + cited RAG; **no Vertex embeddings / Firestore** |
| Agent 3 Diet | ~70% | ADK + nutrition KB + safety; KB is a focused subset |
| Orchestrator (Nasiko) | ~25% | cloned + configured; not running, agents not registered |
| Memory layer | ~5% | designed only; in-memory, no `lib/memory.js` |
| HITL gate | ~40% | agent flags correctly; no `/api/review` endpoints or UI |
| Remaining UI (dashboard, doctor chat, upload, records, review queue) | ~10% | only diet exists; **login still 404s** |
| Google infra (Firestore/Storage/DocAI/Auth/Vertex) | ~3% | |
| Cloud Run deployment | 0% | mandatory, not begun |
| **Overall** | **~30–35%** | |

---

## 🔜 What's Left (priority order)

1. **Cloud Run deployment** — get *any* public URL live (mandatory 10%; currently zero).
2. **Bring up Nasiko** — start Docker Desktop, `docker compose -f docker-compose.local.yml --env-file .nasiko-local.env up -d`, register the 3 agents, configure the router (needs an OpenAI-compatible key — see below).
3. **Vertex AI in Agent 2** — swap lexical search for `text-embedding-004` to earn the Vertex depth score.
4. **Wire the UI to the agents** (via Nasiko `/router`, with `/api/*` demo fallbacks).
5. **Memory layer** (`lib/memory.js` + Firestore) and **HITL endpoints/UI** (`/api/review/*`, ReviewQueue).
6. **Remaining UI pages** — main dashboard (fixes the post-login 404), doctor chat, upload, records.
7. **Real Firebase Auth, Document AI, Cloud Storage, Cloud Logging.**
8. (Optional) **Gemini CLI** to satisfy the literal Track B authoring workflow.

---

## ⚠️ Known Blockers / Decisions

- **Gemini API key** — not set. You'll add `GOOGLE_API_KEY` to `.env` (from https://aistudio.google.com/apikey). Agents' LLM layer is inert until then.
- **Nasiko router LLM** — Nasiko's router only supports `openai` / `openrouter` / `minimax` (OpenAI-compatible). **Gemini is not a native router provider.** Easiest fix: a free **OpenRouter** key in `.nasiko-local.env`. (Gemini still powers the agents themselves.)
- **Docker Desktop** — daemon must be running before bringing up the Nasiko stack.
- **Nasiko on Cloud Run** — it's a 13-container stack; Cloud Run is one-container-per-service. Recommended: run Nasiko via compose on a VM, deploy agents + UI to Cloud Run.

---

## 🏃 How to Run (today)

```bash
# 1. Agents (tools work without a key; LLM needs GOOGLE_API_KEY)
cd agents && GOOGLE_API_KEY=... docker compose up --build
curl http://localhost:5001/.well-known/agent-card.json   # anonymizer
curl http://localhost:5002/.well-known/agent-card.json   # retriever
curl http://localhost:5003/.well-known/agent-card.json   # diet

# 2. Frontend
npm run dev    # http://localhost:3000

# 3. Nasiko control plane (once Docker Desktop is running)
cd nasiko-platform
docker compose -f docker-compose.local.yml --env-file .nasiko-local.env up -d
# web UI: http://localhost:9100/app/   (superuser: admin@medsync.local / MedSync@2026)
```
