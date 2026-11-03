# Record Menu

A voting jukebox for a vinyl-only bar. The bar's collection lives in a Discogs
collection; guests browse "the menu" and vote for the records they want to hear,
and the most-wanted ones rise to the top.

> **Status: in progress.** The project is scaffolded with a full Docker + CI/CD
> foundation. The product features (auth, the menu, voting, Discogs sync) aren't
> built yet — see the roadmap.

## Architecture

| Part              | Tech                                             | State       |
| ----------------- | ------------------------------------------------ | ----------- |
| `web/`            | Next.js 16 (App Router), TypeScript, Tailwind    | (DONE) base |
| Database & auth   | Supabase (Postgres, Auth, Row Level Security)    | planned     |
| `sync/`           | Python job syncing the Discogs collection        | planned     |
| `infra/`          | Terraform for Azure                              | planned     |
| CI/CD             | GitHub Actions → image published to GHCR         | (DONE)      |

## What's done

- **Web app** — Next.js 16 scaffold with a `/api/health` endpoint, strict
  TypeScript, Tailwind, ESLint, and a Vitest test.
- **Docker** — multi-stage build producing a small, non-root image with a
  container healthcheck; `compose.yaml` for local runs.
- **CI/CD** — GitHub Actions: lint / typecheck / test / build + a docker build on
  every pull request, and a release workflow that publishes the image to GHCR on
  every merge to `main`.

## Roadmap

1. (DONE) Scaffold — web app, tooling, Docker, CI/CD
2. Deploy skeleton to Azure Container Apps (Terraform)
3. Auth — sign up / log in, profiles
4. Data model + Row Level Security (Supabase)
5. Discogs sync job (Python)
6. The menu + voting UI
7. Operations — monitoring, backups

## Run it locally

Requires Node 22+, pnpm, and Docker.

```bash
# dev server
cd web && pnpm install && pnpm dev        # http://localhost:3000

# or with Docker
docker build -t record-menu-web ./web
docker run --rm -p 3000:3000 record-menu-web

# or with Compose
docker compose up --build
```

Health check: `curl http://localhost:3000/api/health` → `{"status":"ok","uptime":<seconds>}`

## Container image

Published to GitHub Container Registry on every merge to `main`:

```
ghcr.io/drlin23/record-menu:latest
```
