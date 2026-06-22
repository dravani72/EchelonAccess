# Netlify Subdirectory Setup for EchelonAccess

Goal: serve the application at:

```text
https://echelonaccess.com/app
```

Important: DNS can point a domain or subdomain, but not a subdirectory. That means `echelonaccess.com/app` must be handled by the site already serving `echelonaccess.com`, or that site must proxy `/app/*` to this app.

## What This Repo Already Does

This app is configured to build under `/app` on Netlify:

```toml
[build.environment]
NEXT_PUBLIC_BASE_PATH = "/app"
```

Local development remains at:

```text
http://127.0.0.1:3000
```

Netlify production becomes:

```text
https://echelonaccess.com/app
```

## Recommended Setup: Same Netlify Site Owns `echelonaccess.com`

Use this path if `echelonaccess.com` will be hosted by the same Netlify project as this app.

1. Log in to Netlify.
2. Click **Add new project**.
3. Click **Import an existing project**.
4. Choose **GitHub**.
5. Select `dravani72/EchelonAccess`.
6. For **Branch to deploy**, choose the branch that contains the app changes.
7. Set **Base directory** to blank.
8. Set **Build command** to:

   ```text
   npx next build
   ```

9. Set **Publish directory** to:

   ```text
   .next
   ```

10. Click **Deploy**.
11. After the deploy finishes, open the generated Netlify URL and add `/app` at the end.
12. Confirm the app loads at:

   ```text
   https://YOUR-NETLIFY-SITE.netlify.app/app
   ```

13. In Netlify, open the project.
14. Go to **Project configuration**.
15. Go to **Domain management**.
16. Click **Add a domain**.
17. Enter:

   ```text
   echelonaccess.com
   ```

18. Follow the Netlify DNS instructions exactly as shown.
19. After DNS is active, test:

   ```text
   https://echelonaccess.com/app
   ```

## Alternate Setup: Existing Website Stays Separate

Use this path if `echelonaccess.com` is already hosted by a different Netlify site and only `/app` should point to this application.

1. Deploy this application as its own Netlify project first.
2. Confirm it loads at:

   ```text
   https://YOUR-APP-SITE.netlify.app/app
   ```

3. Open the Netlify project that currently serves `echelonaccess.com`.
4. Add this redirect/proxy rule to that website project, not this app project:

   ```toml
   [[redirects]]
   from = "/app/*"
   to = "https://YOUR-APP-SITE.netlify.app/app/:splat"
   status = 200
   force = true
   ```

5. Redeploy the `echelonaccess.com` website project.
6. Test:

   ```text
   https://echelonaccess.com/app
   ```

## Supabase Auth Redirects

If Supabase auth is enabled, add this URL in Supabase:

```text
https://echelonaccess.com/app/auth/callback
```

In Supabase:

1. Open your Supabase project.
2. Go to **Authentication**.
3. Go to **URL Configuration**.
4. Add the callback URL above to the allowed redirect URLs.
5. Save.

## Netlify Environment Variables

In the Netlify app project, set these environment variables if using Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BASE_PATH=/app
NEXT_PUBLIC_DEMO_PASSWORD
```

`NEXT_PUBLIC_BASE_PATH=/app` is already declared in `netlify.toml`, but setting it in the Netlify UI as well is harmless and makes the deployment intent visible.
