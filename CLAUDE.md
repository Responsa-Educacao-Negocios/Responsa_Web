# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured. TypeScript type checking: `npx tsc --noEmit`.

## Architecture

**Responsa-web** is a SaaS HR diagnostics platform with two portals:
- **Admin portal** (`/dashboard`, `/projetos`, `/clientes`, `/consultores`, `/ferramentas`) — for consultants managing projects
- **Client portal** (`/portal`) — for client users accessing surveys and contracts
- **Public surveys** (`/pesquisa`) — unauthenticated survey response pages

### Tech stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- Supabase (PostgreSQL + Auth)
- ApexCharts (`react-apexcharts`) for data visualization
- React Compiler enabled (`next.config.ts`)
- Path alias: `@/*` → `./src/*`

### Auth flow
No middleware file. Authentication is handled at the page level:
1. `supabase.auth.getSession()` on page mount
2. Unauthenticated → redirect to `/login`
3. Login queries `CONSULTORES` (→ `/dashboard`) or `USUARIOS_CLIENTE` (→ `/portal`) to determine role
4. `cd_auth_supabase` stores the Supabase User UUID in both role tables

### Supabase clients
- `src/lib/supabase.ts` — public client (anon key), used in client components
- `src/lib/supabaseAdmin.ts` — admin client (service role key), used only in API routes

Environment variables required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Key database tables
`PROJETOS`, `CONSULTORES`, `USUARIOS_CLIENTE`, `EMPRESAS`, `TIPOS_CONSULTORIA`, `FATURAS` — plus survey tables for DISC, climate, and time management assessments.

### Routing conventions
- Most pages are `"use client"` components fetching data via `useEffect` + Supabase
- Dynamic project routes: `/projetos/[id]/` with a shared sidebar layout (`/projetos/[id]/layout.tsx`)
- API routes follow `/src/app/api/[resource]/[action]/route.ts`; use the admin client and return `NextResponse.json()`

### DISC assessment
`src/lib/disc-utils.ts` contains the core logic: 50-question array, score calculation (`calcularPontuacaoDisc`), profile derivation (`derivarPerfilDisc`), and job-fit scoring (`calcularAderencia`). DISC colors: D=red, I=yellow, S=green, C=blue.

### Styling
Tailwind v4 with a custom theme in `src/app/globals.css`. Primary: `#064384` (blue), accent: `#ff8323` (orange). Icons use **Material Symbols Outlined** loaded via Google Fonts CDN. Font: Montserrat.
