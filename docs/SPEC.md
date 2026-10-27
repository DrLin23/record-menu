# Record Menu (working title) - Spec

Status: draft v0.1, October 2026. Owner: Dragos.

## 1. What this is

A website for a bar that plays records only. The bar's record library lives
in one Discogs collection. Guests sign up, browse the library ("the menu")
and vote for what they want to hear. The most wanted records rise to the top.

One bar, one library. Guests do not connect their own Discogs accounts.

## 2. Scope of v1

In:
- Sign up, log in, log out (email and password, email confirmation).
- Public record menu: cover, artist, title, year, vote count, sorted by votes.
- Logged-in users can vote for a record and take the vote back.
  One vote per user per record.
- The menu stays in sync with the bar's Discogs collection automatically.
- "Data provided by Discogs" next to record data, linking to the release page.

Out (do not build, and do not add abstractions to prepare for them):
- Guests connecting their own Discogs account.
- Voting nights or rounds, "mark as played", live requests.
- Live-updating vote counts.
- Book club, movie nights, events.
- Admin UI, moderation, payments, native apps.

## 3. Architecture

| Part | Tech | Runs on |
|---|---|---|
| web/ | Next.js 16 (App Router), TypeScript, Tailwind, Zod | Azure Container Apps |
| Database and auth | Supabase (Postgres, Auth, RLS), hosted | Supabase cloud |
| sync/ | Python job, scheduled | Azure Container Apps job (cron) |
| infra/ | Terraform | n/a |
| CI/CD | GitHub Actions, images in GHCR | n/a |

- The browser only talks to web/ and to Supabase with the publishable key.
- The Discogs token and the Supabase secret key exist only in sync/ and in
  server-side code. They never reach the browser or the repo.

## 4. Data model (v1)

profiles
- id uuid, primary key, references auth.users
- display_name text
- created_at timestamptz
- Created automatically by a trigger when a user signs up.

records
- id bigint, primary key (the Discogs release id)
- title text, artist text, year int (nullable)
- thumb_url text, discogs_url text
- is_active boolean (false once the record leaves the collection)
- first_seen_at, last_seen_at timestamptz

votes
- user_id uuid, references profiles
- record_id bigint, references records
- created_at timestamptz
- primary key (user_id, record_id)

sync_runs
- id, started_at, finished_at
- status text ('ok' or 'failed')
- records_seen, records_added, records_deactivated int
- error text (nullable)

Row Level Security is on for every table:
- records: anyone can read. Only the sync job writes.
- votes: a user can read, insert and delete only their own votes.
  Vote counts are public as an aggregate only (view or function),
  never as raw vote rows.
- profiles: a user can read and update only their own row.
- sync_runs: server-side only.

## 5. Discogs sync

- Source: GET /users/{DISCOGS_USERNAME}/collection/folders/{DISCOGS_FOLDER_ID}/releases
  Folder 0 is the whole collection. Paginated, up to 100 per page.
- Auth: the collection owner's personal access token, sent as
  `Authorization: Discogs token=...`, plus a unique User-Agent.
- Limits: 60 authenticated requests per minute. Read the rate limit headers
  and back off on HTTP 429.
- Behaviour: upsert every release seen, update last_seen_at, set
  is_active=false for records not seen in this run, write one sync_runs row.
  Running the job twice in a row must be harmless (idempotent).
- Schedule: every 3 hours.
- Store only the fields in section 4. Do not keep raw API responses.

## 6. Rules the system must meet

- Freshness: data shown from Discogs is never more than 6 hours old.
  Alert when the last successful sync is older than 5 hours.
- Attribution: "Data provided by Discogs" next to record data with a link to
  the Discogs release page, plus a footer line saying the site is not
  affiliated with Discogs.
- Security: RLS on every table, with a test for each policy. No secrets in git.
- Health: GET /api/health reports app status and the age of the last good sync.
- Every change goes through a pull request with green CI.

## 7. Build order (one session and one pull request per step)

1. Scaffold: web/ app, tooling, tests, Dockerfile, CI. No features.
2. Deploy the skeleton: Terraform, Container Apps, deploy on merge.
3. Auth: sign up, log in, log out, session refresh (proxy.ts), profiles.
4. Data model: migrations, RLS, pgTAP tests, seed data.
5. Sync job: Python, tests against a mocked Discogs API, scheduled run.
6. Menu and voting UI, one Playwright end-to-end test.
7. Operations: stale-sync alert, uptime check, backup and tested restore,
   one written postmortem.

## 8. Later, in rough order

- Staff role and "mark as played", which clears that record's votes.
- Voting nights and live requests.
- Live vote counts (Supabase Realtime).
- Book club page.

## 9. Open questions

- App name.
- Which Discogs account and folder is the bar's library?
- Read the Discogs API Terms of Use and confirm the 6-hour rule, the
  attribution wording and what is allowed for cover images.