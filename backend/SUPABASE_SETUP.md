# Supabase setup

The database files live under `backend/supabase/` so Supabase remains a backend
concern. No project credentials are committed.

## Current files

- `supabase/migrations/20260808012000_initial_schema.sql`: initial schema,
  constraints, indexes, update triggers, RLS, and service-role grants.
- `supabase/seed.sql`: the six approved sports and their BP 2026 tournaments.

## Security model

- Browser/public frontend requests continue to use the Express API.
- `SUPABASE_SECRET_KEY` is server-only and must never be placed in frontend
  files or exposed to a browser. `SUPABASE_SERVICE_ROLE_KEY` remains supported
  only as a legacy fallback.
- `SUPABASE_PUBLISHABLE_KEY` is the non-secret key intended for browser auth;
  it still must be paired with RLS and backend authorization.
- Every public-schema table has RLS enabled and grants for `anon` and
  `authenticated` are revoked. The Express backend will verify the admin's
  Supabase access token before using its server-side client in the auth phase.
- The initial provisional roles are `super_admin` (all sports) and
  `sport_admin` (one assigned sport). Confirm this model with the owner before
  production accounts are created.

## Apply locally later

The official Supabase CLI requires Node.js 20+ and a running Docker-compatible
environment. From `backend/`, initialize/link the project and run:

```sh
supabase db reset
```

For a linked remote project, review the migration first and then run:

```sh
supabase db push
```

Copy `.env.example` to `.env` and fill `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` only after the project
exists. Never commit `.env`.
