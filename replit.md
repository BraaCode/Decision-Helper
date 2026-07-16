# قرار — مساعد اتخاذ القرار

A full-stack Arabic-first (RTL) decision-making web app. Users lay out their choices visually — options, criteria with weights, and ratings — to find the best decision through weighted scoring and visual comparison.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/qarrar run dev` — run the frontend (port 23069)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, shadcn/ui, Wouter routing, Recharts
- Auth: Clerk (email/password + Google OAuth)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/decisions.ts` — DB schema: decisions, options, criteria, ratings tables
- `artifacts/api-server/src/routes/decisions.ts` — all decision API route handlers
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy for prod
- `artifacts/qarrar/src/App.tsx` — frontend root with Clerk + Wouter routing
- `artifacts/qarrar/src/pages/` — Landing, DecisionsList, DecisionWizard (new), DecisionResults ([id])

## Architecture decisions

- All API endpoints are scoped to the authenticated user's Clerk `userId` — enforced in `requireAuth` middleware in `decisions.ts`
- Clerk uses cookie-based auth on web; no Bearer tokens needed in browser API calls
- Scores are computed server-side in `/decisions/:id/scores` using weighted formula: `sum(score * weight)` / `sum(5 * weight)`
- Ratings are upserted (PUT) not created — one rating per option+criterion pair
- DB cascade deletes: deleting a decision removes all its options, criteria, ratings

## Product

- Users sign up / sign in with Google or email+password
- Create a decision with a question, add 2–5 options, define criteria with weights (1–5), rate each option per criterion (1–5)
- Results page shows weighted scores as bar chart and highlights the winning option
- Each user sees only their own decisions (private by default)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/*` packages, run `pnpm run typecheck:libs` before typechecking artifact packages or you'll get stale module errors
- Clerk `clerkProxyUrl` must be unconditional (not gated on NODE_ENV) — it's empty in dev by design
- Vite config has `tailwindcss({ optimize: false })` — required for Clerk themes to work correctly in prod builds

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup details and troubleshooting
