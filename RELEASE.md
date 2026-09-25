# Workout Tracker Releases

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`

| Change | Example | Bump |
|---|---|---|
| Bug fixes only | 1.1.0 → 1.1.1 | PATCH |
| New features | 1.1.1 → 1.2.0 | MINOR |
| Breaking / major changes | 1.2.0 → 2.0.0 | MAJOR |

---

## 1.2.1

**Date:** 2026-09-25
**Deployment status:** Pending (built and tested locally, not yet pushed to Render)

Fixes from the first test on a phone.

### Bug fixes

- Workout player showed a reps form for timed exercises (Plank) and a timer for rep exercises (e.g. Russian Twists, Push-Ups). TIME / REPS now always comes from the exercise in the Exercise Library; plan rows saved earlier with no type or the wrong type are corrected automatically
- Plan editor: TIME / REPS is filled in from the exercise and can no longer be set to the wrong type
- Plan editor: "Full Body" and "Upper / Lower Body" plans showed "No exercises found" and hid the plan's exercises; categories now match correctly (Full Body = all exercises) and a plan's existing exercises always show

### Performance

- API responses 2-4x faster: related data loaded in batches instead of one query per row, analytics loads each set once, and the logged-in user is cached for a few minutes instead of being read from the database on every request
- First app start downloads less: pages load when opened (main bundle 440 KB -> 315 KB)

---

## 1.2.0

**Date:** 2026-09-25
**Deployment status:** Deployed 2026-09-25 (frontend 132901f)

Goal: friends can install and use the app for free, on any device, without an app store.

### New features

- **Get the app page** (`/install`, public, no login): install steps for the visitor's device, one-tap install where the browser supports it, QR code, and a "Share link" button (WhatsApp etc.)
- Share link `https://workout-tracker-ui-g065.onrender.com/?install` opens the Get the app page
- 📲 in the Navbar now also works on iPhone / iPad, Mac Safari and Firefox: it opens a short "how to install" guide for that device
- "📲 Get the app" link on the Login and Register pages
- iPhone / iPad: proper 180 px home-screen icon, opens full-screen like an app
- Android: padded "maskable" icon so the round launcher mask no longer cuts the logo
- Free keep-awake job (GitHub Actions, every 5 minutes) so the backend no longer sleeps and friends don't wait 1-2 minutes

### Deployment notes

- GitHub Actions workflow `.github/workflows/keep-backend-awake.yml` runs automatically after push; check the repository's **Actions** tab. GitHub pauses scheduled workflows after 60 days without commits - re-enable it there if that happens.

---

## 1.1.0

**Date:** 2026-09-25
**Deployment status:** Deployed 2026-09-25 (frontend 595aec2, backend 5b25c6c)

### New features

- Installable app: compact 📲 icon in the Navbar when the browser supports installation; hidden once installed or running standalone
- Update icon: compact 🔄 in the Navbar when a newer version is published; one click activates the new version and reloads (replaces the large update banner)
- Automatic version check on start, every 30 minutes, and when returning to the app
- Exercise Library: every exercise is tracked by **reps** or **time**; add / edit / delete; built-in exercises are locked for normal users
- Workout Plans: choosing an exercise pre-fills its default reps or time; saving a plan is all-or-nothing

### Bug fixes

- Pages showed "Unable to load exercises / workout plans" when the Render backend was waking up from sleep (took 70-145 s, app gave up after 15 s). Requests now wait up to 3 minutes, page loads retry once, the server is pinged as soon as the app opens, and a small "Waking up the server…" indicator is shown while waiting
- Push-ups and other rep exercises no longer show "30 seconds"
- Logo, favicon and install icons were not loading (wrong file paths)
- Workout Player text was invisible in dark mode
- Wrong password / duplicate username showed "server error" instead of a clear message
- Login with email address did not work
- Deleting an exercise used in workout history crashed instead of explaining why

### Security

- Users can no longer read, change or delete other users' workout plans or custom exercises
- Invalid input is rejected with clear validation messages

### Deployment notes

- Backend needs `ADMIN_USERNAMES` set on Render (comma-separated usernames allowed to edit built-in exercises)
- Backend adds three nullable columns to `exercises` automatically on start: `tracking_type`, `default_reps`, `created_by`

---

## 1.0.0

**Date:** 2026-09 (initial production release)
**Deployment status:** Deployed

### Features

- Authentication (register, login, JWT, session expiry)
- Dashboard
- Exercise Library
- Workout Plans
- Workout Player (TIME and REPS exercises, sets, rest timer)
- Workout History
- Progress Tracking
- Analytics (personal records, 1RM)
- Light / dark theme
- PWA with version check

---

# Release process

## 1. Choose the new version

Use the table at the top. Update the version in **all three** files:

- `package.json` → `"version"`
- `src/config/appVersion.js` → `APP_VERSION`
- `public/version.json` → `"version"`

`npm run build` stops with a "Version mismatch" error if they differ.

## 2. Add a section to this file

Version, date, new features, bug fixes, deployment status.

## 3. Test locally

- [ ] `npm run build` succeeds
- [ ] `npm run preview` → open http://localhost:4174
- [ ] Login, Dashboard, Exercise Library, Workout Plans
- [ ] Workout Player: one TIME and one REPS exercise, save
- [ ] Workout History, Progress, Analytics
- [ ] Light and dark theme
- [ ] Install icon (Chrome/Edge) and update icon

## 4. Commit and push

```
git add -A
git commit -m "Release Workout Tracker vX.Y.Z"
git push origin main
```

Render builds and deploys automatically after the push.

## 5. Verify production

- [ ] https://workout-tracker-api-fwlz.onrender.com/api/health returns `UP`
- [ ] https://workout-tracker-ui-g065.onrender.com opens and shows the new version in the Navbar
- [ ] An already-open or installed copy shows 🔄; clicking it loads the new version
- [ ] Mark the release as **Deployed** in this file
