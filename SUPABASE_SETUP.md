# Supabase, Portal, And Offline Setup

EchelonAccess now has a Supabase-backed multi-user portal architecture plus an offline-first app shell.

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

Before running `supabase/seed.sql`, replace the placeholder `owner_user_id` with a real user id from Supabase Dashboard > Authentication > Users.

## 4. Multi-user portal model

The database is tenant-isolated by workspace:

- `workspaces`
- `workspace_members`
- `people`
- `organizations`
- `roles`
- `business_cards`
- `interactions`
- `mandates`
- `outreach_queue`
- `review_tasks`
- `sync_events`

Every relationship-intelligence table has `workspace_id`. Supabase Row Level Security limits reads and writes to users who belong to that workspace.

Workspace roles:

- `owner`
- `admin`
- `member`
- `viewer`

The app creates a default private workspace for a newly authenticated user if they do not have one yet.

## 5. Auth

When Supabase env vars are configured, the lock screen uses Supabase magic-link authentication.

Callback route:

```txt
/auth/callback
```

For production, configure this URL in Supabase Auth redirect URLs.

## 6. Offline/PWA

The app includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icon.svg`
- IndexedDB persistence through Dexie
- local sync queue scaffolding in `lib/offline/`

The app shell can be installed on laptop, tablet, and phone from a modern browser. Offline writes should be queued locally and replayed to Supabase when the device comes back online.

## 7. Current data behavior

The app now reads from Supabase when env vars are present and falls back to local mock data otherwise.

When Supabase is configured but the user is not signed in, the app presents the Supabase Auth login flow.
