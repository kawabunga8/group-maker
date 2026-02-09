# Group Maker - Complete Setup Guide

## Phase 1: Supabase Database Setup

### Step 1.1: Create Supabase Project
1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose any name, set a strong password, select your region
4. Wait ~2 minutes for deployment

### Step 1.2: Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this entire SQL script:

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

4. Click **Run** (▶ button)
5. Verify no errors appear

### Step 1.3: Get API Credentials
1. Go to **Settings** (gear icon) > **API**
2. Copy these values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **Anon/Public API Key**: Long string starting with `eyJ`
3. Save both values temporarily (you'll paste in next section)

---

## Phase 2: Codespace Development Environment

### Step 2.1: Install Dependencies
```bash
cd /workspaces/group-maker
npm install
```

Expected output: `added XXX packages in Xs`

### Step 2.2: Create Environment File
In terminal, run this command to create `.env.local`:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EOF
```

Replace:
- `https://xxxxx.supabase.co` with your actual Project URL from Step 1.3
- `your_anon_key_here` with your actual Anon/Public API Key from Step 1.3

**Verify it was created:**
```bash
cat .env.local
```

### Step 2.3: Verify Build Works
```bash
npm run build
```

Expected output should end with: `✓ Compiled successfully`

---

## Phase 3: Run the Development Server

### Step 3.1: Start Dev Server
```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in XXXms
```

### Step 3.2: Forward Port (Codespace)

**Option A: Via Codespace UI**
1. Look at bottom of VS Code for **PORTS** tab (may need to click "Terminal")
2. See `3000` in the list
3. Right-click `3000` → **Make Public** (or click eye icon)
4. Click the URL that appears to open browser

**Option B: Via Command Line**
```bash
gh codespace ports forward 3000:3000
```

### Step 3.3: Open in Browser
- Click the URL from port forwarding, OR
- Open browser to: `http://localhost:3000`

You should see:
- ✅ "Group Maker" heading
- ✅ "Create Class" button and input field
- ✅ "No classes yet" message

---

## Phase 4: Test the Application

### Step 4.1: Create a Test Class
1. In the app, type "Math Class" in the input
2. Click "Create Class"
3. You should see it appear in the list with a date

### Step 4.2: Add Students
1. Click "Open" on your class
2. You should see the class name at top
3. In the left panel "Students", type "John" in the input
4. Click "Add Student"
5. Repeat for: "Sarah", "Mike", "Emma", "Alex"

### Step 4.3: Test Bulk Add
1. Click "Bulk Add" button
2. Paste:
```
Lisa
Tom
Zoe
```
3. Click "Add All"
4. You should now have 8 students

### Step 4.4: Generate Groups
1. Set "Group Size" to **3**
2. Select "Allow Last Group Smaller"
3. Click "Generate"
4. You should see 3 groups displayed below:
   - Group 1 (3 students)
   - Group 2 (3 students)
   - Group 3 (2 students)

### Step 4.5: Test Copy & Regenerate
1. Click "Copy" - groups are copied to clipboard
2. Click "Regenerate" - groups reshuffle (students same, order different)
3. Try different group sizes (2, 4, 5)

---

## Phase 5: Git Commit & Push

### Step 5.1: Check What's Staged
```bash
git status
```

You should see:
- ✅ Multiple files marked as "modified" or "new file"
- ❌ `.env.local` should NOT appear (it's in .gitignore)

### Step 5.2: Stage All Changes
```bash
git add .
```

### Step 5.3: Commit
```bash
git commit -m "feat: initial Group Maker app with classes, students, and grouping"
```

### Step 5.4: Push to GitHub
```bash
git push origin main
```

Expected output should show remote acceptance and indicate commits pushed.

### Step 5.5: Verify on GitHub
1. Go to https://github.com/yourusername/group-maker
2. Refresh page
3. You should see your files listed with commit message

---

## Phase 6: Stop & Restart Your Server

### To Stop the Dev Server (in Codespace)
Press `Ctrl+C` in the terminal running `npm run dev`

### To Restart the Dev Server
```bash
npm run dev
```

### To Rebuild After Changes
1. Stop server (`Ctrl+C`)
2. Run: `npm run build`
3. Restart: `npm run dev`

---

## Common Issues & Fixes

### Issue: "NEXT_PUBLIC_SUPABASE_URL is missing"
**Fix**: Check `.env.local` exists and has correct values
```bash
cat .env.local
```

### Issue: "Cannot connect to Supabase"
**Fix**: Verify your API key and URL are correct and copied fully

### Issue: "Students won't add to database"
**Fix**: Check that RLS is disabled in Supabase (should be from Step 1.2)

### Issue: "Port 3000 already in use"
**Fix**: 
```bash
kill $(lsof -t -i :3000)  # Kill existing process
npm run dev               # Start fresh
```

---

## File Reference

| File | Purpose |
|------|---------|
| `app/page.tsx` | Classes list & create class UI |
| `app/class/[id]/page.tsx` | Class detail: students & groups UI |
| `lib/supabaseClient.ts` | Supabase client initialization |
| `lib/grouping.ts` | Group generation algorithm |
| `.env.local` | Your Supabase credentials (NOT committed) |
| `.env.example` | Template showing required env vars |

---

## Next Steps (Optional Enhancements)

- Add student search/filter
- Export groups to CSV
- Add authentication (Supabase Auth)
- Store group generation history
- Add themes/dark mode
