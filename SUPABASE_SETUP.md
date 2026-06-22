# Supabase Setup

EchelonAccess now has a Supabase-ready data layer.

## 1. Create a Supabase project

Create a project in Supabase, then copy:

- Project URL
- Anon public key

## 2. Configure local env

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create tables

Open the Supabase SQL editor and run:

1. `supabase/schema.sql`
2. `supabase/seed.sql` if you want starter data

## 4. Current auth state

The app now reads from Supabase when env vars are present and falls back to local mock data otherwise.

The visible password lock is still an MVP client-side gate. Production auth should replace it with Supabase Auth and server-side route/session protection.
