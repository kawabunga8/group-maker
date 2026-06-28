# Group Maker

A web-based application for creating random groups from a class of students. Built with Next.js, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

## Features

- ✨ Create and manage multiple classes
- 📥 Import a real course roster (current-quarter-aware) from Student Hub, or type/paste names manually
- 👥 Add students individually or in bulk
- 🎲 Generate random groups with configurable size
- ⚙️ Choose leftover handling strategy (allow smaller groups or distribute across groups)
- 📋 Copy groups to clipboard for easy sharing
- 🔄 Regenerate groups while keeping the same student list

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL — the shared "kawabunga8's Project", same one TOC-Dayplans, Student Hub, Report Card Tool, and Kawahoot use
- **Auth**: Real Supabase Auth (same `@myrcs.ca` staff account as the other RCS apps), gated by `middleware.ts`
- **Client**: `@supabase/supabase-js` + `@supabase/ssr`

## Quick Start

### Prerequisites

- Node.js 16+ installed locally
- Access to the shared Supabase project (ask Mr. Kawamura, or check the other RCS apps' env vars — they all point at the same project)

### 1. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
```

Get these from the Supabase dashboard → Project Settings → API Keys, on the shared project. **Never commit real values** — `.env.local` is gitignored, and `.env.example` should only ever hold blank placeholders.

### 2. Database

The shared schema (`public.classes`, `public.students`, `public.courses`, `public.enrollments`, etc.) is owned and migrated by the **student-hub** repo — see `student-hub/supabase/shared-schema.sql` and `student-hub/supabase/migrations/`. Group Maker's own ad-hoc classes/students live in `public.group_maker_classes`/`public.group_maker_students` (separate from the real student records, since groupings here are often manually-typed and not tied to a real course).

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
│   ├── layout.tsx                    # Global layout & metadata
│   ├── page.tsx                      # Classes list, create class, import a real course roster
│   ├── login/                        # Staff sign-in (same account as other RCS apps)
│   ├── api/courses/                  # Read-only: current-quarter-aware real course list + roster
│   ├── globals.css                   # Tailwind CSS
│   └── class/[id]/page.tsx           # Class detail: students & grouping
├── lib/
│   ├── supabase/{client,server,admin}.ts  # Supabase client variants (browser/SSR/service-role)
│   ├── require-auth.ts               # Server-side auth check for API routes
│   ├── supabaseClient.ts             # Browser client + Class/Student types (group_maker_* tables)
│   └── grouping.ts                   # Group generation logic (Fisher-Yates)
├── middleware.ts                     # Gates every route except /login behind @myrcs.ca auth
├── .env.example                      # Reference for env variables (placeholders only)
├── .gitignore                        # Git ignore rules
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind CSS config
└── README.md                         # This file
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
- All Supabase queries are wrapped with error handling
- The grouping algorithm uses Fisher-Yates shuffle for randomization
- Tailwind CSS is used for styling—no custom CSS files needed
- Importing a course roster is a one-time snapshot into `group_maker_students`, not a live sync — re-import if the real roster changes

## Future Enhancements

- Export groups to CSV/PDF
- Edit student names after creation
- Group templates based on common sizes
- Statistics & history of generated groups

## License

MIT
