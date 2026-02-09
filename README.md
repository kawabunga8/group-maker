# Group Maker

A web-based application for creating random groups from a class of students. Built with Next.js, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

## Features

- ✨ Create and manage multiple classes
- 👥 Add students individually or in bulk
- 🎲 Generate random groups with configurable size
- ⚙️ Choose leftover handling strategy (allow smaller groups or distribute across groups)
- 📋 Copy groups to clipboard for easy sharing
- 🔄 Regenerate groups while keeping the same student list

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Client**: @supabase/supabase-js

## Quick Start

### Prerequisites

- Node.js 16+ installed locally or in Codespace
- Supabase account (https://supabase.com)

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run this script to create tables:

```sql
-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX students_class_id_idx ON public.students(class_id);

-- Disable RLS for development (enable in production)
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
```

3. Get your credentials:
   - Go to Settings > API
   - Copy `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - Copy `anon public` API Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 2. Clone and Setup in Codespace

```bash
# Navigate to your repo
cd /workspaces/group-maker

# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EOF

# Build to verify everything works
npm run build
```

### 3. Run Development Server

```bash
# Start the Dev Server
npm run dev

# In Codespace, forward port 3000:
# 1. Click "Ports" tab at bottom
# 2. Right-click port 3000 and select "Make Public"
# 3. Or automatically: gh codespace ports forward 3000:3000

# Open in browser
# http://localhost:3000
```

### 4. Git Workflow

```bash
# Check status
git status

# Your .env.local will NOT be committed (added to .gitignore)
# Commit your changes
git add .
git commit -m "Initial commit: Group Maker app"

# Push to GitHub
git push origin main
```

## Project Structure

```
group-maker/
├── app/
│   ├── layout.tsx              # Global layout & metadata
│   ├── page.tsx                # Classes list & create class
│   ├── globals.css             # Tailwind CSS
│   └── class/
│       └── [id]/
│           └── page.tsx        # Class detail: students & grouping
├── lib/
│   ├── supabaseClient.ts      # Supabase client & types
│   └── grouping.ts            # Group generation logic
├── .env.example               # Reference for env variables
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind CSS config
└── README.md                  # This file
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Development Notes

- The app uses React hooks (`useState`, `useEffect`) for state management
- All Supabase queries are wrapped with error handling
- The grouping algorithm uses Fisher-Yates shuffle for randomization
- Tailwind CSS is used for styling—no custom CSS files needed

## Future Enhancements

- Authentication & user accounts
- Export groups to CSV/PDF
- Edit student names after creation
- Group templates based on common sizes
- Statistics & history of generated groups

## License

MIT