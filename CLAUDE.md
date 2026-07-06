# Project Rules for Claude

## Core Principles

1. **Always test code before saying done** - Run tests, verify functionality works, and confirm the implementation is complete before marking any task as finished.

2. **Suggest better approaches** - If my idea seems wrong or there's a better way to accomplish something, speak up. I value good solutions over being right.

3. **Explain technical decisions in plain English** - No jargon dumps. Break down why we're doing something in terms anyone can understand.

4. **Ask clarifying questions rather than guessing** - When requirements are unclear or ambiguous, ask first. Don't make assumptions that could lead us down the wrong path.

## Project Overview

**RadarBuds** is a cannabis strain rating app — the sibling of RadarWines (~/winerate) but a fully separate product: its own repo (Stonewallkid/RadarBuds), its own Vercel project (`radarbuds`), its own database. Never share infrastructure with RadarWines.

Users rate strains across 13 effect dimensions (Potency, Euphoria, Creativity, Focus, Energy, Relaxation, Sleep Aid, Pain Relief, Anxiety Relief, Munchies, Smoothness, Aroma, Flavor) on a radar chart.

## Stack & Database

- Next.js (App Router, TypeScript), Prisma + PostgreSQL, Supabase auth, Tailwind
- Local dev DB: Homebrew Postgres — `DATABASE_URL="postgresql://52kilo@localhost:5432/radarbuds"`
- Prisma client generated to `src/generated/prisma`; uses `@prisma/adapter-pg` with a config object (not a `pg.Pool` — the Pool form clashes with newer `@types/pg`)

```bash
npm run db:push       # sync schema
npm run db:seed       # seed 25 strains / ~375 ratings (tsx prisma/seed.ts)
npm run build         # always run to verify before done
```

## Deployment (Vercel project: radarbuds)

Connected to GitHub — pushes to main auto-deploy. Production env vars required in Vercel before the first working deploy:

- `DATABASE_URL` — from the RadarBuds Supabase project (use the pooler URL, port 6543, `?pgbouncer=true`)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the RadarBuds Supabase project (NOT the RadarWines one)

After envs are set, push the schema and seed against the production DB by running the db commands with `DATABASE_URL` set explicitly (same pattern as RadarWines).
