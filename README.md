# Bridgestone Cup BP 2026

Public frontend prototype for the Bridgestone Cup employee sports event.

## Local preview

Serve the repository root with a static server, then open `frontend/index.html`.

## Backend development

The API requires Node.js 20.6 or newer.

```sh
cd backend
pnpm install
pnpm dev
```

The health endpoint is available at `http://localhost:3000/api/health`. Copy
`backend/.env.example` to `backend/.env` when local configuration needs to be
changed. Run `pnpm test` to execute the backend tests.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the contents of
`frontend/` whenever `master` or `main` is pushed. In the GitHub repository,
set **Settings → Pages → Source** to **GitHub Actions**.

## Production preparation

Do not put `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or the local
`backend/.env` file in the frontend or repository. Those values belong only in
the environment-variable settings of the backend hosting provider.

Before enabling the GitHub Pages deployment:

1. Deploy the `backend/` application to a Node.js hosting provider.
2. Configure `NODE_ENV=production`, the Supabase variables, and
   `ALLOWED_ORIGINS=https://ekoputranugraha.github.io` on that provider.
3. Verify `https://<backend-host>/api/health` and confirm the database status is
   connected.
4. Set `window.BRIDGESTONE_API_URL` to `https://<backend-host>/api` before the
   frontend modules run.
5. Smoke-test the public pages, admin login, one read action, and one reversible
   admin update against production before announcing the site.

The current repository remains configured for local development until a
backend provider and production URL are approved by the project owner.
