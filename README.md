# hexcoded — AI Creative Production Pipeline

A recruiter-demo ready prototype of a full-stack AI creative production pipeline. Creative teams set a brief, consult a local AI Creative Director (Qwen 2.5 3B via Ollama) for 3 distinct strategic directions, batch-upload source photos, run them through a configurable Generate → Upscale → Caption pipeline producing N variants per asset, review side-by-side with the originals, and export an approved campaign package.

---

## Architecture

```
frontend/   React 19 + Vite + React Flow + Tailwind CSS v4
backend/    Node.js + Express + SQLite (better-sqlite3)
            In-process concurrency-limited worker queue
            Local AI: Ollama (qwen2.5:3b) for creative reasoning, copy, scoring
            Local rendering: Sharp for deterministic image composition
```

**AI Architecture transparency:**
- **Qwen 2.5 3B (Ollama)** — creative reasoning / strategy / ad copy / AI scoring
- **Sharp** — local deterministic visual composition (layouts, backgrounds, typography)

---

## Running Locally

### Prerequisites

1. Node.js ≥ 18
2. [Ollama](https://ollama.ai) installed and running with the `qwen2.5:3b` model

```bash
# Install and start Ollama
ollama serve
ollama pull qwen2.5:3b
```

> **Note:** Ollama is for local development/demo only. If Ollama is unavailable, the app automatically falls back to a local rule-based creative engine — indicated by **LOCAL RULE ENGINE** in the UI.

### Start the backend

```bash
cd backend
npm install
cp .env.example .env   # adjust if needed
node src/server.js     # http://localhost:8787
```

### Start the frontend (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_BASE if backend is on a different port
npm run dev            # http://localhost:5173
```

Open http://localhost:5173 and run the full journey:

1. **Dashboard** → New campaign
2. **Brief** → enter campaign goal, audience, style, platform; set variant count (1–4); upload assets
3. **AI Creative Director** → review 3 AI-generated strategic directions; select one
4. **Workflow canvas** → review the pipeline (Generate → Upscale → Caption → Export); Run Production
5. **Results** → Keep / Reject variants; Regenerate individual variants; Export campaign.zip

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8787` | Backend port |
| `PUBLIC_BASE_URL` | `http://localhost:8787` | Used to build file URLs in API responses |
| `OLLAMA_HOST` | `http://localhost:11434` | Local Ollama instance |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Model used for creative direction and captions |
| `MAX_DEMO_ITEMS` | `8` | Max assets per run |
| `MAX_DEMO_VARIANTS` | `4` | Max variants per asset |
| `WORKER_CONCURRENCY` | `3` | Parallel variant processing |
| `VITE_API_BASE` | `http://localhost:8787` | Frontend API base URL |

---

## Deployment Notes

- **Frontend** → Vercel / Netlify (set `VITE_API_BASE` to your deployed backend URL)
- **Backend** → Render / Railway / any Node host with persistent disk (SQLite + local disk need a writable volume)
- The app works without Ollama running — it falls back gracefully to a local rule-based engine
- No paid AI providers required for the demo

---

## What's Real vs. Demo-Scoped

| Layer | Status |
|---|---|
| Data model, API, worker orchestration | ✓ Real |
| Per-variant tracking, retry, keep/reject | ✓ Real |
| Campaign export (.zip packaging) | ✓ Real |
| AI creative direction (Qwen via Ollama) | ✓ Real local AI |
| Image composition (Sharp) | ✓ Real local rendering |
| SQLite | → Swap to Postgres for production |
| Local disk storage | → Swap to S3/Supabase for production |
| In-process queue | → Swap to BullMQ + Redis for scale |
