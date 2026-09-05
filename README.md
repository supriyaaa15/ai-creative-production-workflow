# Node-Based Batch Creative Pipeline

A working prototype: creative teams set a brief, batch-upload source photos, run them through a configurable Generate → Upscale → Caption pipeline (producing N variants per asset), review results side-by-side with the originals, and export an approved campaign package.

## Architecture at a glance

- **Backend**: Node/Express + SQLite (`backend/`) — API + in-process job worker
- **Frontend**: React + Vite + React Flow + Tailwind (`frontend/`)
- Storage is local disk for this prototype (swap `backend/src/lib/storage.js` for S3/Supabase to go to production)
- Export is a **terminal packaging step**, not part of AI processing — it zips whatever variants are marked "keep" after review

## Demo mode (no API keys needed)

By default, Generate/Upscale/Caption run in a **free, offline demo mode** (real image transforms via `sharp`, templated captions) so you can run the whole flow — brief → canvas → batch run → review → export — at zero cost and with no external dependencies.

To use real AI models, set these env vars in `backend/.env`:

```
REPLICATE_API_TOKEN=...     # enables real Generate + Upscale via Replicate
OPENAI_API_KEY=...          # enables real vision captions via GPT-4o-mini
```

The app detects these automatically at startup and logs which mode each node is running in.

## Running locally

```bash
# Backend
cd backend
npm install
npm start          # http://localhost:8787

# Frontend (separate terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Open http://localhost:5173, create a campaign with 3-5 test photos, and run it — the demo-scale guardrails (max 8 assets / 4 variants by default, configurable via `MAX_DEMO_ITEMS` / `MAX_DEMO_VARIANTS` env vars) keep runs fast and cheap while the underlying schema and worker support larger batches unmodified.

## Deploying

- Frontend → Vercel (set `VITE_API_BASE` to your deployed backend URL)
- Backend → Render/Railway (any Node host with persistent disk works — SQLite + local file storage need a writable volume)
- For production scale: swap SQLite → Postgres, local disk → S3/Supabase Storage, and the in-process queue (`backend/src/worker/queue.js`) → BullMQ + Redis. Call sites are isolated so none of this touches route/worker logic.

## What's real vs. demo-scoped

Real: the full data model, API, worker orchestration, retry logic, per-variant tracking, campaign export packaging, and the actual Replicate/OpenAI integration code paths.
Demo-scoped intentionally: SQLite instead of Postgres, local disk instead of S3, in-process queue instead of Redis, and free fallback generation instead of paid APIs by default — all swappable, none of it mocked UI.
