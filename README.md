# Group Maker

A web-based application for creating random groups from a class of students. Built with Next.js, TypeScript, and Tailwind CSS, reading live course rosters from Course Hub.

## Features

- 📥 Browse your current-quarter-aware courses and open one to see its roster, pulled live from Course Hub
- 🧩 Combine two or more courses into a merged roster for cross-class grouping
- 🙋 Mark students absent to exclude them from grouping/picking without editing the roster
- 🎲 Generate random groups with configurable size
- ⚙️ Choose leftover handling strategy (allow smaller groups or distribute across groups)
- 📋 Copy groups to clipboard for easy sharing
- 🔄 Regenerate groups while keeping the same student list
- 🎯 Pick a single random student from the class

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Data**: No database of its own — courses and rosters are read live from **Course Hub** via its API. Course Hub owns the underlying Postgres data — as of 2026-09-23, that's a self-hosted local Supabase stack (`local-stack`, holding real migrated student data), not the original cloud project. **Read `local-stack/STATUS.md` first** for the current picture.
- **Auth**: Real Supabase Auth (same `@myrcs.ca` staff account as the other RCS apps), gated by `middleware.ts`
- **Client**: `@supabase/supabase-js` + `@supabase/ssr` (auth only — no direct table queries)

### Infrastructure note (2026-09-23)

This app's `.env.local` points at the local stack (`http://127.0.0.1:54421`-style URL) — old cloud credentials preserved in `.env.local.cloud-backup`, not deleted. Its Vercel deployment is **paused** (aliases return `503 DEPLOYMENT_PAUSED`) and **git↔Vercel auto-deploy has been disconnected** (`vercel git disconnect`) — `git push` no longer creates any new deployment. Re-enabling either is a deliberate action, not a side effect of normal development.

## Quick Start

### Prerequisites

- Node.js 16+ installed locally
- Access to the shared Supabase project for auth (ask Mr. Kawamura, or check the other RCS apps' env vars — they all point at the same project)
- A Course Hub API key (ask Mr. Kawamura) — required for the course/roster proxy to work

### 1. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
COURSE_HUB_URL=
COURSE_HUB_API_KEY=
```

Get the Supabase values from the Supabase dashboard → Project Settings → API Keys, on the shared project (used for auth only). Get `COURSE_HUB_URL`/`COURSE_HUB_API_KEY` from Course Hub — Group Maker calls its API to read courses and rosters. **Never commit real values** — `.env.local` is gitignored, and `.env.example` should only ever hold blank placeholders.

### 2. Data

Group Maker has no database of its own. `app/api/courses` and `app/api/courses/[id]/roster` are thin, auth-gated proxies that call Course Hub's API (`COURSE_HUB_URL`) for the current-quarter-aware course list and rosters — see the **course-hub** repo for the underlying schema and migrations. Combining classes just merges multiple roster fetches client-side; nothing is persisted.

### 3. Run

```bash
npm install
npm run dev
# http://localhost:3000 — sign in with your @myrcs.ca account
```

## Project Structure

```
group-maker/
├── app/
│   ├── layout.tsx                       # Global layout & metadata
│   ├── page.tsx / ClassesClient.tsx      # Courses list (by school year) + "combine classes" picker
│   ├── login/                            # Staff sign-in (same account as other RCS apps)
│   ├── api/courses/                      # Auth-gated proxy to Course Hub: course list + roster
│   ├── globals.css                       # Tailwind CSS
│   ├── class/[id]/                       # Single class: roster & grouping
│   └── class/combined/                   # Merged roster from multiple selected classes
├── components/
│   └── GroupingView.tsx                  # Shared grouping UI: absences, group gen, random pick
├── lib/
│   ├── supabase/{client,server}.ts       # Supabase client variants (browser/SSR) — auth only
│   ├── supabase/admin.ts                 # Service-role client — currently unused, kept for future server-side needs
│   ├── require-auth.ts                   # Server-side auth check for API routes
│   ├── supabaseClient.ts                 # Cached browser client
│   └── grouping.ts                       # Group generation logic (Fisher-Yates)
├── middleware.ts                         # Gates every page route except /login behind @myrcs.ca auth
├── .env.example                          # Reference for env variables (placeholders only)
├── .gitignore                            # Git ignore rules
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind CSS config
└── README.md                             # This file
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Development Notes

- The app uses React hooks (`useState`, `useEffect`) for state management
- Rosters are fetched live on every page load — there's no local cache or snapshot, so roster changes in Course Hub show up immediately
- The grouping algorithm uses Fisher-Yates shuffle for randomization
- Tailwind CSS is used for styling—no custom CSS files needed
- `middleware.ts` skips `/api/*` routes, so each API route calls `requireAuth` itself — that check is the only access control on student data (no Supabase RLS is involved, since this app doesn't query tables directly)

## Future Enhancements

- Export groups to CSV/PDF
- Group templates based on common sizes
- Statistics & history of generated groups

## AI & student data (if adding an AI feature here)

Group Maker doesn't call any AI provider today. Standing RCS rule if that changes: Claude is fine for features with no student data in the prompt; anything sending individual student records to an AI must use a locally-run model instead — see rcs-report-card-tool's `CLAUDE.md` for the established pattern.

## License

MIT
