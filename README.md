# 🏥 MedSync AI

> **AI agents that turn medical chaos into continuity** — for India's pregnant women and chronic-care patients.
> *Agent Arena Bangalore 2026 · Track B: Enterprise Agent Engineering.*
> **Workflow:** `Gemini CLI + ADK → Nasiko → Cloud Run`

A patient's medical story is scattered across hospitals, WhatsApp photos, and PDFs.
MedSync stitches it back into one continuous, private, intelligent thread — and
supports the whole journey, from records to the 2 a.m. infant cry.

---

## ✨ Core features

| Feature | Problem → Solution |
|---|---|
| 🔒 **Record privacy** | Sharing files exposes your name/Aadhaar/phone → auto-redact all PII before sharing, with a human approving uncertain redactions. |
| 🔍 **Instant history** | A new doctor digs through years of scattered reports → get a short, **cited** summary with links to the original proof. |
| 🥗 **Diet help** | Diet plans list costly/unavailable foods → swap them for affordable local Indian alternatives with matched nutrition + safety. |
| 👶 **Baby cry insight** | A tired mother can't tell why her newborn cries → record the cry, get the likely reason + soothing tips (grounded in the Donate-a-Cry dataset). *Insight, not diagnosis.* |
| 🔔 **Treatment follow-up** | Dangerous side effects get noticed too late → a check-in companion catches serious symptoms early and escalates. |
| 🧠 **Memory** | Patients hate repeating themselves → the system learns conditions/preferences once and never re-asks. |
| 🎛️ **Orchestration** | Users shouldn't know which tool does what → ask one question; **Nasiko** routes it to the right agent. |

---

## 🤖 The 5 agents

All are **ADK `LlmAgent`s exposed over the A2A protocol** (Nasiko's native format).
Each pairs **Gemini** (language/perception) with a **deterministic tool** (the real
logic + safety), so guidance is never improvised.

| Agent | Tools | Role |
|---|---|---|
| `anonymizer` | `detect_pii`, `apply_redaction` | Redacts PII; flags 70–90%-confidence spans for human review (HITL) |
| `retriever` | `search_records` | RAG over anonymized records → cited clinical summary |
| `diet` | `find_substitutes` | Indian ingredient substitutions + pregnancy/diabetes safety |
| `cry_analyzer` | `cry_guidance` | Gemini multimodal audio → cry category (Donate-a-Cry taxonomy) + escalation |
| `followup` | `get_active_medications`, `check_side_effect`, `log_side_effect` | Post-treatment side-effect tracking + early escalation |

---

## 🏗️ Architecture

```
        Patient / Doctor (Next.js UI)
                   │  one question
                   ▼
        🎛️ NASIKO CONTROL PLANE
        registry · LLM router · gateway (A2A) · tracing · policy
          │        │        │        │        │
          ▼        ▼        ▼        ▼        ▼
       🔒 anon  🔍 retr  🥗 diet  👶 cry  🔔 follow-up   (ADK agents)
          └────────┴───── 🧠 Memory Layer ──────┘
                    (read-before / write-after)
```

- **Nasiko** = the orchestrator: one endpoint, routes to the right agent, traces every call.
- **Memory service** (`memory-service/`) = shared substrate keyed by `patientId`
  (profile, preferences, semantic memory via Gemini embeddings).
- **Human-in-the-loop** = a person approves uncertain redactions / serious side effects.

---

## 🧰 Tech stack

**Gemini 2.5** (incl. multimodal audio) · **Gemini embeddings** (`text-embedding-004`)
· **ADK** + **A2A** · **Nasiko** control plane · **Cloud Run** (deploy target) ·
**Next.js** UI · **FastAPI** memory service · **Docker**.

---

## 📁 Repo structure

```
app/                  Next.js frontend (landing, auth, dashboard, diet)
agents/               5 ADK/A2A agents + shared memory client
  anonymizer/ retriever/ diet/ cry_analyzer/ followup/
  cry_analyzer/data/  Donate-a-Cry sample + manifest
memory-service/       FastAPI memory layer (4 tiers)
docs/                 implementation plan, pitch material
DEPLOYMENT.md         local + Cloud Run + Nasiko deploy guide
CURRENT_STATUS.md     honest progress snapshot
```

---

## 🚀 Quick start

```bash
# 1. Frontend
npm install && npm run dev          # http://localhost:3000

# 2. Agents + memory (needs a Gemini key for the LLM layer)
cd agents && GOOGLE_API_KEY=... docker compose up --build
curl http://localhost:5002/.well-known/agent-card.json   # retriever card
curl http://localhost:8090/health                          # memory

# 3. Nasiko control plane  (see DEPLOYMENT.md)
```

Set secrets in `.env` (copy from `.env.example`; never committed).
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for Cloud Run + Nasiko, and
**[CURRENT_STATUS.md](CURRENT_STATUS.md)** for what's built vs. in progress.

---

## 📌 Status (honest)

Built & verified: 5 ADK/A2A agents, the memory layer (cross-session recall), HITL
escalation logic, and the Donate-a-Cry dataset wiring. Designed & configured but
**not yet live**: the Nasiko stack running end-to-end and the Cloud Run public
deployment. See [CURRENT_STATUS.md](CURRENT_STATUS.md).

> ⚕️ MedSync provides **supportive insight, not medical diagnosis.**
