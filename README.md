# JARVIS Personal Tracker

A private, JARVIS-inspired personal tracker for college students.
Track money received, daily expenses, experiences, goals, and notes — all secured with Supabase.

---

## Quick Setup (5 Steps)

### Step 1 — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → Create a free account
2. Create a new project (choose any region)
3. Wait for it to initialize (~2 minutes)

### Step 2 — Run the Database Schema
1. In your Supabase dashboard → Go to **SQL Editor**
2. Open the file `supabase-setup.sql` from this project folder
3. Copy the entire content and paste it into the SQL Editor
4. Click **Run** — all tables, RLS policies, and indexes will be created

### Step 3 — Get Your Supabase Keys
In your Supabase project dashboard:
- Go to **Settings → API**
- Copy your **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
- Copy the **anon / public** key (the long string under "Project API keys")

### Step 4 — Configure Environment Variables
1. In the `jarvis-tracker` folder, copy `.env.example` to `.env`:
   ```
   copy .env.example .env
   ```
2. Open `.env` and fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5 — Create Your Account and Run
1. In Supabase go to Authentication, then Users, then Add User
2. Enter your email and password
3. Back in the project folder, run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:5173
5. Login with the credentials you created

---

## Features

| Section | What it does |
|---------|-------------|
| Dashboard | Overview with stat cards, donut expense chart, recent activity |
| Money | Track money received from parents, family, scholarships |
| Expenses | Log daily expenses by category with filters |
| Experiences | Timeline of personal memories and milestones |
| Goals | Financial and non-financial goal tracker with progress |
| Notes | Private notes with search and categories |
| Settings | Profile, password change, data export |

---

## Tech Stack

- Frontend: React + Vite
- Database: Supabase PostgreSQL
- Auth: Supabase Authentication
- Security: Row Level Security (RLS) on all tables
- Charts: Recharts
- Icons: Lucide React
- Notifications: React Hot Toast

---

## Security Notes

- Your .env file is gitignored — never commit it
- Only the Supabase anon/public key is used in the frontend (safe)
- Row Level Security ensures users can only access their own data
- The service-role key is never used in frontend code

---

## Build for Production

```bash
npm run build
```

The dist folder can be deployed to Netlify, Vercel, or any static hosting.
