# Futuristic Restaurant — Fullstack Scaffold

This repository is a scaffold for the Futuristic Restaurant Management & Ordering System.

What's included:

- `worker/` — Cloudflare Workers backend scaffold (API routes, JWT skeleton)
- `db/schema.sql` — Cloudflare D1 schema (full table definitions)
- `frontend/` — Frontend instructions to create React + Tailwind app
- `.env.example` — Example environment variables

Next steps:

1. Install Worker dependencies in `worker/` (see `worker/package.json`).
2. Create a Vite React + Tailwind app inside `frontend/` (instructions in `frontend/README.md`).
3. Provision D1 database and R2 bucket in Cloudflare Workers.
4. Deploy via `wrangler publish` using `wrangler.toml`.

See `infra/notes.md` for deployment steps and cost/security notes.
