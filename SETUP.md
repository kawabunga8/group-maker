# Group Maker — Setup Guide

Group Maker has **no database of its own**. Courses and rosters are read live from
Course Hub through its API; Supabase is used only to sign in with the same
`@myrcs.ca` staff account as the other RCS apps. There are no tables to create.

## Phase 1: Credentials

You need two sets of values. Neither belongs in the repo — put them in
`.env.local`, which is gitignored.

### 1.1: Shared Supabase project (auth only)

Group Maker authenticates against the shared project, "kawabunga8's Project" —
the same one TOC-Dayplans, Course Hub, Report Card Tool and KawaHoot use. Ask
Mr. Kawamura, or copy the values from any of those apps' env vars.

From the Supabase dashboard, **Project Settings → API Keys**:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Publishable (client-side) key |
| `SUPABASE_SECRET_KEY` | Secret key — server-side only, never exposed to the browser |

Do not create a new Supabase project for this app. It used to have one, which
became an orphan holding student names after the move to Course Hub.

### 1.2: Course Hub API

Course Hub is the source of truth for every course and roster. Without these two
the app signs in but shows no classes.

| Variable | Where it comes from |
|---|---|
| `COURSE_HUB_URL` | Course Hub's base URL, no trailing slash |
| `COURSE_HUB_API_KEY` | Course Hub API key — ask Mr. Kawamura |

## Phase 2: Local Development

### 2.1: Install

```bash
npm install
```

### 2.2: Environment file

Copy the template and fill in the five values from Phase 1:

```bash
cp .env.example .env.local
```

Confirm `.env.local` does not appear in `git status` before committing anything.

### 2.3: Run

```bash
npm run dev
```

Then open http://localhost:3000. You should be redirected to a login page —
`middleware.ts` gates every route. Sign in with your `@myrcs.ca` account.

## Phase 3: Verify

After signing in you should see a card per course, labelled
`Block A — CP 11` and so on, pulled live from Course Hub.

| Check | Expected |
|---|---|
| Course list | One card per course you teach this quarter |
| Open a course | Its real roster, not names you typed |
| Combine classes | Two or more courses merged into one roster |
| Mark absent | Excluded from grouping and picking, roster unchanged |
| Generate | Groups of the configured size; leftovers handled per the chosen strategy |
| Pick a student | One student at random from those present |

Courses are filtered to the quarter running today, so a course scoped to a later
quarter will not appear yet. That is expected — but if a course you teach *right
now* is missing, that is a bug worth chasing rather than a setting to change. It
usually means a quarter value did not match on the Course Hub side.

## Common Issues

**Login page loops, or "Missing Supabase env"** — one of the three Supabase
values is absent or truncated. `SUPABASE_SECRET_KEY` is the easiest to miss; it
is required server-side even though the browser never sees it.

**Signs in fine, but no courses appear** — almost always `COURSE_HUB_URL` or
`COURSE_HUB_API_KEY`. Both proxy routes return the upstream status and body in
`detail`, so check the network response rather than guessing.

**Some courses appear and others do not** — the proxy asks Course Hub for the
current quarter only. Courses with no quarter set run all year and always show;
quarter-scoped ones appear only in their own quarter.

**Port 3000 already in use**

```bash
kill $(lsof -t -i :3000)
```

## File Reference

| File | Purpose |
|---|---|
| `middleware.ts` | Gates every route behind Supabase auth |
| `app/ClassesClient.tsx` | Course list, year selector, combine-classes picker |
| `app/api/courses/route.ts` | Authenticated proxy to Course Hub's course list |
| `app/api/courses/[id]/roster/route.ts` | Authenticated proxy to a course's roster |
| `components/GroupingView.tsx` | Grouping, absent marking, random picker |
| `lib/grouping.ts` | Group generation algorithm |
| `lib/require-auth.ts` | Shared auth guard for the API routes |
| `.env.local` | Your credentials — never committed |
| `.env.example` | Template listing the required variables |
