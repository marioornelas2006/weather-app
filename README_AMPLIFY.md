# AWS Amplify version

This build converts the app from Netlify Functions to a Next.js app with API routes that AWS Amplify Hosting supports.

## What changed
- Frontend now lives in `public/app.html`
- Root URL redirects to `/app.html`
- Backend endpoints are now:
  - `/api/config`
  - `/api/gemini`
  - `/api/progchart`
  - `/api/awc`
  - `/api/runways`
  - `/api/pdfextract`

## Required Amplify environment variables
Set these in Amplify Hosting:
- `CHECKWX_API_KEY`
- `GEMINI_API_KEY`

## Important
This repo includes `amplify.yml` so Amplify writes the environment variables into `.env.production` before the Next.js build.


v2 fix:
- Changed the Amplify preBuild step from `npm ci` to `npm install`.
- This avoids the deployment failure when the repo does not include a `package-lock.json`.


v3 fix:
- Removed the redirect from `/` to `/app.html`.
- The app now renders directly from `pages/index.js`, which is more reliable for Amplify Hosting with Next.js.
- API routes remain under `pages/api/*`.


v4 fix:
- The homepage now serves the raw HTML directly from `pages/index.js` instead of inserting it with `dangerouslySetInnerHTML`.
- That means the inline `<script>` now executes normally, which should restore:
  - weather map rendering
  - Main / Background / Retry AI buttons
  - route loading logic
  - overall AI analysis
