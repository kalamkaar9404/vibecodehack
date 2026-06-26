# 🚀 MedSync AI — Deployment Guide

> **Track B workflow:** `Gemini CLI + ADK → Nasiko → Cloud Run`
> Goal: a working **public Cloud Run URL** (mandatory) with the 5 agents + memory
> orchestrated by Nasiko.

This guide covers **local dev**, **Cloud Run deployment**, and the **Nasiko**
control-plane options.

---

## 0. What deploys where

| Component | What it is | Recommended host |
|---|---|---|
| **Next.js UI** | `app/` (the public site) | **Cloud Run** (this is the mandatory public URL) |
| **5 ADK agents** | `agents/{anonymizer,retriever,diet,cry_analyzer,followup}` | Cloud Run services **or** registered into Nasiko |
| **Memory service** | `memory-service/` (FastAPI) | Cloud Run service (or alongside Nasiko) |
| **Nasiko control plane** | `nasiko-platform/` (13-service stack) | **A VM via docker-compose** (not committed; cloned locally) |

> **Why Nasiko on a VM, not Cloud Run?** Cloud Run runs one container per service;
> Nasiko is a 13-container stack (Kong, Mongo, Redis, router, Phoenix, …).
> Easiest reliable path: run Nasiko via `docker-compose` on one Compute Engine VM,
> and deploy the **UI + agents + memory** to Cloud Run.

---

## 1. Prerequisites

- **gcloud CLI** (`gcloud --version`) — [install](https://cloud.google.com/sdk/docs/install), then:
  ```bash
  gcloud auth login
  gcloud config set project <YOUR_GCP_PROJECT_ID>
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
  ```
- **Docker Desktop** running (for local stack / building images)
- **A Gemini API key** — https://aistudio.google.com/apikey
- A region — examples use **`asia-south1`** (Mumbai).

> The repo currently has **no `gcloud`** installed locally — install it before the
> Cloud Run steps.

---

## 2. Environment variables

Copy `.env.example` → `.env` (gitignored) and fill in. Key vars:

| Var | Used by | Notes |
|---|---|---|
| `GOOGLE_API_KEY` | agents, memory embeddings, UI route | **takes precedence over `GEMINI_API_KEY`** — set the real key here or blank it |
| `GOOGLE_GENAI_USE_VERTEXAI` | agents | keep `FALSE` to use the API-key path |
| `MEDSYNC_MODEL` | agents | `gemini-2.5-flash` |
| `MEMORY_URL` | agents | `http://memory:8090` (compose) or the deployed memory URL |
| `ROUTER_LLM_PROVIDER` / `..._MODEL` / `OPENROUTER_API_KEY` | Nasiko router | Gemini is **not** a native router provider — use an OpenAI-compatible key (e.g. free OpenRouter) |

> Never commit secrets. For Cloud Run, pass `--set-env-vars` or use **Secret Manager**.

---

## 3. Run everything locally (sanity check first)

```bash
# Agents + memory (5 agents on :5001-5005, memory on :8090)
cd agents && GOOGLE_API_KEY=... docker compose up --build
curl http://localhost:5002/.well-known/agent-card.json   # retriever card
curl http://localhost:8090/health                         # memory

# Frontend
npm install && npm run dev          # http://localhost:3000

# Nasiko control plane (once Docker Desktop is up)
cd nasiko-platform
docker compose -f docker-compose.local.yml --env-file .nasiko-local.env up -d
# web UI: http://localhost:9100/app/   (superuser: admin@medsync.local / MedSync@2026)
```

---

## 4. Deploy the Next.js UI to Cloud Run  (mandatory public URL)

`gcloud run deploy --source .` uses Google Cloud Buildpacks, which detect Next.js,
run `npm run build`, and start it. Next.js respects the `$PORT` Cloud Run provides.

```bash
gcloud run deploy medsync-ui \
  --source . \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=<key>"
```

After it succeeds you get a public URL like
`https://medsync-ui-xxxxx-el.a.run.app` — **that is your mandatory live URL.**

> If buildpacks misbehave, add a `Dockerfile` with `output: 'standalone'` in
> `next.config.mjs` and a multi-stage Node build (see §8). Buildpacks are the
> faster first attempt.

---

## 5. Deploy the memory service to Cloud Run

```bash
cd memory-service
gcloud run deploy medsync-memory \
  --source . \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8090 \
  --set-env-vars="GOOGLE_API_KEY=<key>"
# note the URL, e.g. https://medsync-memory-xxxxx.run.app
```

> Cloud Run filesystems are ephemeral — the JSON store resets on cold start.
> For persistence, mount a **GCS volume** or switch `store.py` to **Firestore**
> (the API is unchanged). Fine as-is for a demo.

---

## 6. Deploy the 5 agents

Two options:

### Option A — each agent as its own Cloud Run service (simplest to demo)
```bash
for a in anonymizer retriever diet cry_analyzer followup; do
  gcloud run deploy medsync-$a \
    --source agents/$a \
    --region=asia-south1 \
    --allow-unauthenticated \
    --port=5000 \
    --set-env-vars="GOOGLE_API_KEY=<key>,MEMORY_URL=<memory-cloud-run-url>"
done
```
The UI/router then calls each agent's Cloud Run URL.

### Option B — register agents into Nasiko (the Track B story)
Run Nasiko on a VM (§7), then register each agent via the Redis stream:
```bash
docker exec redis redis-cli XADD orchestration:commands '*' \
  command deploy_agent agent_name retriever \
  agent_path /app/agents/retriever base_url http://nasiko-backend:8000 \
  upload_type directory
# repeat for anonymizer, diet, cry_analyzer, followup
```
The UI then calls **one** endpoint — Nasiko's `/router` — which dispatches.

---

## 7. Nasiko on a Compute Engine VM

```bash
# create a VM with Docker (e.g. e2-standard-2, 4GB+ RAM)
gcloud compute instances create nasiko-vm \
  --machine-type=e2-standard-2 --zone=asia-south1-a \
  --image-family=cos-stable --image-project=cos-cloud \
  --tags=nasiko

# open the gateway port
gcloud compute firewall-rules create allow-nasiko \
  --allow=tcp:9100 --target-tags=nasiko

# SSH in, clone Nasiko, add .nasiko-local.env, then:
docker compose -f docker-compose.local.yml --env-file .nasiko-local.env up -d
```
Point the UI's router calls at `http://<VM_EXTERNAL_IP>:9100/router`.

---

## 8. Optional: explicit Dockerfile for the Next.js UI

If buildpacks fail, set `output: 'standalone'` in `next.config.mjs` and use:

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```

---

## 9. Verification (post-deploy smoke tests)

```bash
# UI is live
curl -I https://<medsync-ui-url>/                       # 200

# Orchestrated: one endpoint, Nasiko routes to the right agent
curl -X POST https://<router>/router -F 'query=What is the patient diabetes history?'   # -> retriever
curl -X POST https://<router>/router -F 'query=I cant find quinoa, suggest a swap'      # -> diet

# Direct agent + memory
curl https://<agent-url>/.well-known/agent-card.json
curl https://<memory-url>/health
```

Manual checklist:
- [ ] Public Cloud Run URL loads (mandatory)
- [ ] A `/router` query reaches the correct agent (Nasiko registry shows all 5 healthy)
- [ ] Nasiko/Phoenix trace shows the routed call (tokens/latency/cost)
- [ ] Memory persists profile/preferences across requests
- [ ] HITL: a `NEEDS_REVIEW` document isn't shared until approved

---

## 10. Notes & gotchas

- **`GOOGLE_API_KEY` precedence:** it overrides `GEMINI_API_KEY` everywhere — a
  placeholder value will break auth. Set the real key or blank the line.
- **Cold starts:** Cloud Run scales to zero; first request after idle is slow.
  Add `--min-instances=1` on the demo URL during judging.
- **Secrets:** prefer Secret Manager over `--set-env-vars` for real keys.
- **Region:** keep UI, agents, memory, and the Nasiko VM in the **same region**
  to cut latency.
- **Cost:** scale agents to zero when idle; the Nasiko VM is the main always-on cost.
```
